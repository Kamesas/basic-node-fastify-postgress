import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { argonVerify } from "../../utils/argon";
import {
  tJwtPayload,
  verifyToken,
  generateAccessToken,
  generateRefreshToken,
} from "../../utils/jwt";
import { refreshRouteSchema } from "./auth.schemas";
import {
  findRefreshTokensByUserId,
  deleteRefreshToken,
  storeTokens,
} from "./auth.tokens.models";
import { setAuthCookies } from "../../utils/authCookies";

export default function authTokensRoutes(fastify: FastifyInstance) {
  const f = fastify.withTypeProvider<ZodTypeProvider>();

  f.post("/refresh", { schema: refreshRouteSchema }, async (request, reply) => {
    let refreshToken = request.cookies.refreshToken;

    // If no cookie, check request body (mobile apps)
    if (!refreshToken && request.body?.refreshToken) {
      refreshToken = request.body.refreshToken;
    }

    if (!refreshToken) {
      return reply.code(401).send({
        message: "No refresh token provided",
      });
    }

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

    const accessToken = generateAccessToken(tokenData);
    const newRefreshToken = generateRefreshToken(tokenData);

    await storeTokens(
      tokenData.userId,
      newRefreshToken,
      request.headers["user-agent"]
    );

    setAuthCookies(reply, accessToken, newRefreshToken);

    return reply.code(200).send({
      accessToken,
      refreshToken: newRefreshToken, // For mobile apps - web will use cookie
    });
  });
}
