import z from "zod";
import {
  messageResponseSchema,
  errorResponseSchema,
} from "../../common.schemas";
import { schemaLogin } from "../auth.schemas";

export const forgotPasswordSchema = {
  body: schemaLogin.pick({ email: true }),
  response: {
    200: messageResponseSchema,
  },
};

export const resetPasswordSchema = {
  body: schemaLogin.pick({ password: true, email: true }).extend({
    token: z.string().min(1, "Token is required"),
  }),
  response: {
    200: messageResponseSchema,
    400: errorResponseSchema,
  },
};
