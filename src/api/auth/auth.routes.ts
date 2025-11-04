import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { loginRouteSchema, registerRouteSchema } from "./auth.schemas";
import { argonHash, argonVerify } from "../../utils/argon";
import {
  findUserByUsername,
  findUserByEmail,
  registerWithEmail,
  findUserWithEmailProvider,
  storeRefreshToken,
} from "./auth.models";
import { sendVerificationEmail } from "../../utils/emailService";
import { generateVerificationToken } from "../../utils/token";
import authEmailRoutes from "./auth.emails.routes";
import { setEmailVerificationToken } from "./auth.emails.models";
import {
  generateAccessToken,
  generateRefreshToken,
  tJwtPayload,
} from "../../utils/jwt";

export default function authRoutes(fastify: FastifyInstance) {
  const f = fastify.withTypeProvider<ZodTypeProvider>();

  fastify.register(authEmailRoutes);

  f.post(
    "/auth/register",
    { schema: registerRouteSchema },
    async (request, reply) => {
      const { username, email, displayName, password } = request.body;

      const existingUser = await findUserByUsername(username);
      const existingEmail = email ? await findUserByEmail(email) : null;

      if (existingUser || existingEmail) {
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

      await storeRefreshToken({
        userId: user.id,
        tokenHash: await argonHash(refreshToken),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        deviceInfo: request.headers["user-agent"] // TODO: Add device info
          ? { userAgent: request.headers["user-agent"] }
          : null,
      });

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

  f.post("/auth/refresh", async (_request, reply) => {
    return reply.code(501).send({
      message: "Refresh token endpoint - not implemented yet",
    });
  });

  f.post("/auth/logout", async (_request, reply) => {
    return reply.code(501).send({
      message: "Logout endpoint - not implemented yet",
    });
  });
}
