import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  loginRouteSchema,
  registerRouteSchema,
  refreshRouteSchema,
} from "./auth.schemas";
import { argonHash, argonVerify } from "../../utils/argon";
import {
  findUserByUsernameOrEmail,
  registerWithEmail,
  findUserWithEmailProvider,
} from "./auth.models";
import {
  findRefreshTokensByUserId,
  deleteRefreshToken,
  generateAndStoreTokens,
} from "./auth.tokens.models";
import { sendVerificationEmail } from "../../utils/emailService";
import { generateVerificationToken } from "../../utils/token";
import authEmailRoutes from "./auth.emails.routes";
import authLogoutRoutes from "./auth.logout.routes";
import authPasswordRoutes from "./auth.password.routes";
import { setEmailVerificationToken } from "./auth.emails.models";
import { verifyToken, tJwtPayload } from "../../utils/jwt";

export default function authRoutes(fastify: FastifyInstance) {
  const f = fastify.withTypeProvider<ZodTypeProvider>();

  fastify.register(authEmailRoutes);
  fastify.register(authLogoutRoutes);
  fastify.register(authPasswordRoutes);

  f.post(
    "/auth/register",
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

  f.post(
    "/auth/login",
    { schema: loginRouteSchema },
    async (request, reply) => {
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

      const { accessToken, refreshToken } = await generateAndStoreTokens(
        tokenData,
        request.headers["user-agent"]
      );

      return reply.code(201).send({
        user: {
          ...user,
          displayName: user.display_name,
          createdAt: user.created_at.toISOString(), // TODO: Need to adjust dates
        },
        accessToken,
        refreshToken,
      });
    }
  );

  f.post(
    "/auth/refresh",
    { schema: refreshRouteSchema },
    async (request, reply) => {
      const { refreshToken } = request.body;

      let decoded;

      try {
        decoded = verifyToken(refreshToken);
      } catch (error) {
        return reply.code(401).send({
          message: error instanceof Error ? error.message : "Invalid token",
        });
      }

      const userTokens = await findRefreshTokensByUserId(decoded.userId);

      let storedToken = null;
      for (const token of userTokens) {
        const isValid = await argonVerify(refreshToken, token.token_hash);
        if (isValid) {
          storedToken = token;
          break;
        }
      }

      if (!storedToken) {
        return reply.code(401).send({
          message: "Invalid or revoked token",
        });
      }

      if (
        new Date() > new Date(storedToken.expires_at) ||
        storedToken.user_id !== decoded.userId
      ) {
        return reply.code(401).send({
          message: "Token is invalid",
        });
      }

      const tokenData: tJwtPayload = {
        userId: decoded.userId,
        username: decoded.username,
        email: decoded.email,
      };

      await deleteRefreshToken(storedToken.id);

      const { accessToken, refreshToken: newRefreshToken } =
        await generateAndStoreTokens(tokenData, request.headers["user-agent"]);

      return reply.code(200).send({
        accessToken,
        refreshToken: newRefreshToken,
      });
    }
  );
}
