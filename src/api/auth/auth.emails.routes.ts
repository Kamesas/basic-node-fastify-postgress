import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { findUserByEmail } from "./auth.models";
import { sendVerificationEmail } from "../../utils/emailService";
import { generateVerificationToken } from "../../utils/token";
import {
  findUserByVerificationToken,
  verifyUserEmail,
  setEmailVerificationToken,
} from "./auth.emails.models";
import {
  verifyEmailRouteSchema,
  resendVerificationEmailRouteSchema,
} from "./auth.emails.schemas";

export default function authRoutes(fastify: FastifyInstance) {
  const f = fastify.withTypeProvider<ZodTypeProvider>();

  f.get(
    "/verify-email",
    { schema: verifyEmailRouteSchema },
    async (request, reply) => {
      const { token } = request.query;

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

  f.post(
    "/resend-verification",
    { schema: resendVerificationEmailRouteSchema },
    async (request, reply) => {
      const { email } = request.body;

      const user = await findUserByEmail(email);

      if (!user || user.email_verified) {
        return reply.code(200).send({
          message:
            "If this email is registered and unverified, a verification email has been sent",
        });
      }

      const { token, expiresAt } = generateVerificationToken(24);
      await setEmailVerificationToken(user.id, token, expiresAt);

      await sendVerificationEmail(
        email,
        token,
        user.display_name,
        user.username
      );

      return reply.code(200).send({
        message:
          "If this email is registered and unverified, a verification email has been sent",
      });
    }
  );
}
