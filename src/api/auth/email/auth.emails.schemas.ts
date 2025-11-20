import z from "zod";
import {
  errorResponseSchema,
  messageResponseSchema,
} from "../../common.schemas";

export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export const verifyEmailRouteSchema = {
  querystring: verifyEmailSchema,
  response: {
    200: messageResponseSchema,
    400: errorResponseSchema,
    404: errorResponseSchema,
  },
};

export const resendVerificationEmailSchema = z.object({
  email: z.email("Invalid email format"),
});

export const resendVerificationEmailRouteSchema = {
  body: resendVerificationEmailSchema,
  response: {
    200: messageResponseSchema,
  },
};

export type tVerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type tResendVerificationEmailInput = z.infer<
  typeof resendVerificationEmailSchema
>;
