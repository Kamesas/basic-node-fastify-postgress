import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { registerRouteSchema } from "./auth.schemas";
import { hashPassword } from "../../utils/password";
import {
  findUserByUsername,
  findUserByEmail,
  registerWithEmail,
} from "./auth.models";
import { sendVerificationEmail } from "../../utils/emailService";
import { generateVerificationToken } from "../../utils/token";
import authEmailRoutes from "./auth.emails.routes";
import { setEmailVerificationToken } from "./auth.emails.models";

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

      const passwordHash = await hashPassword(password);

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

  f.post("/auth/login", async (_request, reply) => {
    // const tokenData = {
    //   userId: user.id,
    //   username: user.username,
    //   email: user.email || undefined,
    // };
    //
    // const accessToken = generateAccessToken(tokenData);
    // const refreshToken = generateRefreshToken(tokenData);
    //
    // await storeRefreshToken({
    //   userId: user.id,
    //   tokenHash: await hashPassword(refreshToken),
    //   expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    //   deviceInfo: request.headers["user-agent"]
    //     ? { userAgent: request.headers["user-agent"] }
    //     : null,
    // });

    return reply.code(501).send({
      message: "Login endpoint - not implemented yet",
    });
  });

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
