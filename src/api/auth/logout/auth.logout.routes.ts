import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  deleteRefreshToken,
  deleteRefreshTokensByUserId,
  findRefreshTokensByUserId,
} from "../tokens/auth.tokens.models";
import { argonVerify } from "../../../utils/argon";
import { verifyToken } from "../../../utils/jwt";
import { clearAuthCookies } from "../../../utils/authCookies";
import { logoutRouteSchema, logoutAllRouteSchema } from "./auth.logout.schemas";

export default async function authLogoutRoutes(fastify: FastifyInstance) {
  const f = fastify.withTypeProvider<ZodTypeProvider>();

  f.post("/logout", { schema: logoutRouteSchema }, async (request, reply) => {
    let refreshToken = request.cookies.refreshToken;

    if (!refreshToken && request.body?.refreshToken) {
      refreshToken = request.body.refreshToken;
    }

    if (!refreshToken) {
      clearAuthCookies(reply);
      return reply.code(200).send({ message: "Logged out" });
    }

    let decoded;
    try {
      decoded = verifyToken(refreshToken);
    } catch {
      clearAuthCookies(reply);
      return reply.code(200).send({ message: "Logged out" });
    }

    if (!decoded?.userId) {
      clearAuthCookies(reply);
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

    clearAuthCookies(reply);
    return reply.code(200).send({ message: "Logged out" });
  });

  f.post(
    "/logout-all",
    { schema: logoutAllRouteSchema },
    async (request, reply) => {
      let refreshToken = request.cookies.refreshToken; // Web browsers

      if (!refreshToken && request.body?.refreshToken) {
        refreshToken = request.body.refreshToken;
      }

      if (!refreshToken) {
        clearAuthCookies(reply);
        return reply.code(200).send({ message: "Logged out from all devices" });
      }

      let decoded;
      try {
        decoded = verifyToken(refreshToken);
      } catch {
        clearAuthCookies(reply);
        return reply.code(200).send({ message: "Logged out from all devices" });
      }

      if (!decoded?.userId) {
        clearAuthCookies(reply);
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
        clearAuthCookies(reply);
        return reply.code(401).send({ message: "Invalid refresh token" });
      }

      await deleteRefreshTokensByUserId(decoded.userId);

      clearAuthCookies(reply);
      return reply.code(200).send({ message: "Logged out from all devices" });
    }
  );
}
