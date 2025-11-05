import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { logoutAllRouteSchema, logoutRouteSchema } from "./auth.schemas";
import {
  deleteRefreshToken,
  deleteRefreshTokensByUserId,
  findRefreshTokensByUserId,
} from "./auth.tokens.models";
import { argonVerify } from "../../utils/argon";
import { verifyToken } from "../../utils/jwt";

export default async function authLogoutRoutes(fastify: FastifyInstance) {
  const f = fastify.withTypeProvider<ZodTypeProvider>();

  f.post(
    "/auth/logout",
    { schema: logoutRouteSchema },
    async (request, reply) => {
      const { refreshToken } = request.body;

      let decoded;
      try {
        decoded = verifyToken(refreshToken);
      } catch {
        return reply.code(200).send({ message: "Logged out" });
      }

      if (!decoded?.userId) {
        return reply.code(200).send({ message: "Logged out" });
      }

      const tokens = await findRefreshTokensByUserId(decoded.userId);

      for (const token of tokens) {
        const matches = await argonVerify(refreshToken, token.token_hash);
        if (matches) {
          await deleteRefreshToken(token.id);
          break;
        }
      }

      return reply.code(200).send({ message: "Logged out" });
    }
  );

  f.post(
    "/auth/logout-all",
    { schema: logoutAllRouteSchema },
    async (request, reply) => {
      const { refreshToken } = request.body;

      let decoded;
      try {
        decoded = verifyToken(refreshToken);
      } catch {
        return reply.code(200).send({ message: "Logged out from all devices" });
      }

      if (!decoded?.userId) {
        return reply.code(200).send({ message: "Logged out from all devices" });
      }

      const tokens = await findRefreshTokensByUserId(decoded.userId);
      let isValidToken = false;
      for (const token of tokens) {
        const matches = await argonVerify(refreshToken, token.token_hash);
        if (matches) {
          isValidToken = true;
          break;
        }
      }

      if (!isValidToken) {
        return reply.code(401).send({ message: "Invalid refresh token" });
      }

      await deleteRefreshTokensByUserId(decoded.userId);

      return reply.code(200).send({ message: "Logged out from all devices" });
    }
  );
}
