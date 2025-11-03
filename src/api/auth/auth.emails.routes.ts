import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { verifyEmailRouteSchema } from "./auth.schemas";
import { findUserByVerificationToken, verifyUserEmail } from "./auth.models";

export default function authRoutes(fastify: FastifyInstance) {
  const f = fastify.withTypeProvider<ZodTypeProvider>();

  f.get(
    "/auth/verify-email",
    { schema: verifyEmailRouteSchema },
    async (request, reply) => {
      const { token } = request.params;

      const user = await findUserByVerificationToken(token);

      if (!user || user.email_verified) {
        return reply.code(400).send({
          error: "Bad Request",
          message: "Invalid or expired verification token",
        });
      }

      await verifyUserEmail(user.id);

      return reply.code(200).send({
        message: "Email verified successfully",
      });
    }
  );
}
