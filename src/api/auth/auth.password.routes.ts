import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { argonHash, argonVerify } from "../../utils/argon";
import { sendPasswordResetEmail } from "../../utils/emailService";
import { generateVerificationToken } from "../../utils/token";
import { findUserByEmail } from "./auth.models";
import {
  deletePasswordResetToken,
  storePasswordResetToken,
  updateUserPassword,
} from "./auth.password.models";
import { forgotPasswordSchema, resetPasswordSchema } from "./auth.schemas";
import { db } from "../../_db/dbInstance";

export default async function authPasswordRoutes(fastify: FastifyInstance) {
  const f = fastify.withTypeProvider<ZodTypeProvider>();

  f.post(
    "/forgot-password",
    { schema: forgotPasswordSchema },
    async (request, reply) => {
      const { email } = request.body;

      const user = await findUserByEmail(email);

      if (user) {
        const { token, expiresAt } = generateVerificationToken(0.25);
        const tokenHash = await argonHash(token);
        await storePasswordResetToken(user.id, tokenHash, expiresAt);
        await sendPasswordResetEmail(email, token, user.display_name);
      }

      return reply.send({ message: "Password reset email sent" });
    }
  );

  f.post(
    "/reset-password",
    { schema: resetPasswordSchema },
    async (request, reply) => {
      const { token, password, email } = request.body;

      const user = await findUserByEmail(email);

      if (!user?.password_reset_token) {
        return reply.code(400).send({
          error: "Bad Request",
          message: "Invalid or expired reset token",
        });
      }

      const isTokenValid = await argonVerify(token, user.password_reset_token);
      const expiresAt = user.password_reset_expires_at
        ? new Date(user.password_reset_expires_at)
        : null;
      const isExpired = !expiresAt || expiresAt < new Date();

      if (!isTokenValid || isExpired) {
        if (isExpired) {
          await deletePasswordResetToken(user.id);
        }
        return reply.code(400).send({
          error: "Bad Request",
          message: "Invalid or expired reset token",
        });
      }

      const passwordHash = await argonHash(password);

      await db.transaction().execute(async (trx) => {
        await updateUserPassword(user.id, passwordHash, trx);
        await deletePasswordResetToken(user.id, trx);
      });

      return reply.send({ message: "Password has been reset" });
    }
  );
}
