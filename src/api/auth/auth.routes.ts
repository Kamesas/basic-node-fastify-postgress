import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { argonHash, argonVerify } from "../../utils/argon";
import { setAuthCookies } from "../../utils/authCookies";
import { sendVerificationEmail } from "../../utils/emailService";
import {
  generateAccessToken,
  generateRefreshToken,
  tJwtPayload,
} from "../../utils/jwt";
import { generateVerificationToken } from "../../utils/token";
import googleAuthRoutes from "./oauth/auth.google.routes";
import authLogoutRoutes from "./logout/auth.logout.routes";
import {
  findUserByUsernameOrEmail,
  findUserWithEmailProvider,
  registerWithEmail,
} from "./auth.models";
import { loginRouteSchema, registerRouteSchema } from "./auth.schemas";
import { storeTokens } from "./tokens/auth.tokens.models";
import authTokensRoutes from "./tokens/auth.tokens.routes";
import { setEmailVerificationToken } from "./email/auth.emails.models";
import authEmailRoutes from "./email/auth.emails.routes";
import authPasswordRoutes from "./password/auth.password.routes";

export default function authRoutes(fastify: FastifyInstance) {
  const f = fastify.withTypeProvider<ZodTypeProvider>();

  fastify.register(authEmailRoutes);
  fastify.register(authLogoutRoutes);
  fastify.register(authPasswordRoutes);
  fastify.register(authTokensRoutes);
  fastify.register(googleAuthRoutes);

  f.post(
    "/register",
    { schema: registerRouteSchema },
    async (request, reply) => {
      const { username, email, displayName, password } = request.body;

      const existingUser = await findUserByUsernameOrEmail(username, email);

      if (existingUser) {
        return reply.code(409).send({
          error: "Conflict",
          message: "Username or email already exists",
        });
      }

      const passwordHash = await argonHash(password);

      const { user } = await registerWithEmail({
        username,
        email,
        displayName,
        passwordHash,
      });

      if (email) {
        const { token, expiresAt } = generateVerificationToken(24);

        await setEmailVerificationToken(user.id, token, expiresAt);

        // TODO: Consider fire-and-forget or pg-boss for email sending to avoid blocking the response
        await sendVerificationEmail(email, token, displayName, username);
      }

      return reply.code(201).send({
        message: "All good. Confirm your email please",
      });
    }
  );

  f.post("/login", { schema: loginRouteSchema }, async (request, reply) => {
    const { email, password } = request.body;

    const user = await findUserWithEmailProvider(email);
    // TODO: good for urer expirience and bad for security
    // TODO: as an option could be added rate limiting and maybe CAPTCHA

    if (!user || !user.password_hash) {
      return reply.code(401).send({ message: "Invalid credentials" });
    }

    if (!user.email_verified) {
      return reply.code(403).send({ message: "Verify your email" });
    }

    const isPasswordValid = await argonVerify(password, user.password_hash);
    if (!isPasswordValid) {
      return reply.code(401).send({ message: "Invalid credentials" });
    }

    const tokenData: tJwtPayload = {
      username: user.username,
      email: user.email || undefined,
      userId: user.id,
    };

    const accessToken = generateAccessToken(tokenData);
    const refreshToken = generateRefreshToken(tokenData);

    await storeTokens(
      tokenData.userId,
      refreshToken,
      request.headers["user-agent"]
    );

    setAuthCookies(reply, accessToken, refreshToken);

    return reply.code(201).send({
      user: {
        ...user,
        displayName: user.display_name,
        createdAt: user.created_at.toISOString(), // TODO: Need to adjust dates
      },
      accessToken,
      refreshToken,
    });
  });
}
