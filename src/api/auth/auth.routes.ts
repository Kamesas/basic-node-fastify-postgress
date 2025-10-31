import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { registerRouteSchema } from "./auth.schemas";
import { hashPassword } from "../../utils/password";
import { generateAccessToken, generateRefreshToken } from "../../utils/jwt";
import {
  findUserByUsername,
  findUserByEmail,
  registerEmailUser,
  storeRefreshToken,
} from "./auth.models";

export default function authRoutes(fastify: FastifyInstance) {
  const f = fastify.withTypeProvider<ZodTypeProvider>();

  f.post(
    "/auth/register",
    { schema: registerRouteSchema },
    async (request, reply) => {
      const { username, email, displayName, password } = request.body;

      const existingUser = await findUserByUsername(username);

      if (existingUser) {
        return reply.code(409).send({
          error: "Conflict",
          message: "Username already exists",
        });
      }

      if (email) {
        const existingEmail = await findUserByEmail(email);
        if (existingEmail) {
          return reply.code(409).send({
            error: "Conflict",
            message: "Email already exists",
          });
        }
      }

      const passwordHash = await hashPassword(password);

      const { user } = await registerEmailUser({
        username,
        email,
        displayName,
        passwordHash,
      });

      const tokenData = {
        userId: user.id,
        username: user.username,
        email: user.email || undefined,
      };

      const accessToken = generateAccessToken(tokenData);
      const refreshToken = generateRefreshToken(tokenData);

      await storeRefreshToken({
        userId: user.id,
        tokenHash: await hashPassword(refreshToken),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        deviceInfo: request.headers["user-agent"]
          ? { userAgent: request.headers["user-agent"] }
          : null,
      });

      return reply.code(201).send({
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            displayName: user.display_name,
            createdAt: user.created_at.toISOString(),
          },
          accessToken,
          refreshToken,
        },
      });
    }
  );

  f.post("/auth/login", async (_request, reply) => {
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
