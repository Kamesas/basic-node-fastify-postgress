import { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import fp from "fastify-plugin";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  tJwtVerifyResult,
} from "../utils/jwt";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
    jwt: {
      sign: typeof generateAccessToken;
      signRefresh: typeof generateRefreshToken;
      verify: typeof verifyToken;
    };
  }
  interface FastifyRequest {
    user?: tJwtVerifyResult;
  }
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate("jwt", {
    sign: generateAccessToken,
    signRefresh: generateRefreshToken,
    verify: verifyToken,
  });

  fastify.decorate(
    "authenticate",
    async function (request: FastifyRequest, reply: FastifyReply) {
      try {
        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return reply.code(401).send({
            error: "Unauthorized",
            message: "Missing or invalid authorization header",
          });
        }

        const token = authHeader.replace("Bearer ", "");
        const decoded = verifyToken(token);
        request.user = decoded;
      } catch (error) {
        return reply.code(401).send({
          error: "Unauthorized",
          message: error instanceof Error ? error.message : "Invalid token",
        });
      }
    }
  );
};

export default fp(authPlugin);
