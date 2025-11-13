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

export default function authTokensRoutes(fastify: FastifyInstance) {
  const f = fastify.withTypeProvider<ZodTypeProvider>();

  f.post("/refresh", { schema: refreshRouteSchema }, async (request, reply) => {
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

    const accessToken = generateAccessToken(tokenData);
    const newRefreshToken = generateRefreshToken(tokenData);

    await storeTokens(
      tokenData.userId,
      newRefreshToken,
      request.headers["user-agent"]
    );

    return reply.code(200).send({
      accessToken,
      refreshToken: newRefreshToken,
    });
  });
}
