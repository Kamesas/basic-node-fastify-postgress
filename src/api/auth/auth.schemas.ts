import { z } from "zod";
import { errorResponseSchema, messageResponseSchema } from "../common.schemas";

export const schemaLogin = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  email: z.email("Invalid email format"),
});

export const schemaRegister = schemaLogin.extend({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),
  displayName: z
    .string()
    .min(1, "display name cannot be empty")
    .max(100, "Display name must be at most 100 characters")
    .optional(),
});

export const schemaRefresh = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

const loginDataSchema = z.object({
  user: z.object({
    id: z.number(),
    username: z.string(),
    email: z.string().nullable(),
    displayName: z.string().nullable(),
    createdAt: z.string(),
  }),
  accessToken: z.string(),
  refreshToken: z.string(),
});

const tokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export const registerRouteSchema = {
  body: schemaRegister,
  response: {
    201: messageResponseSchema,
    400: errorResponseSchema,
    409: errorResponseSchema,
  },
};

export const loginRouteSchema = {
  body: schemaLogin,
  response: {
    201: loginDataSchema,
    400: errorResponseSchema,
    401: messageResponseSchema,
    403: messageResponseSchema,
    404: messageResponseSchema,
  },
};

export const refreshRouteSchema = {
  body: schemaRefresh,
  response: {
    200: tokensSchema,
    400: errorResponseSchema,
    401: messageResponseSchema,
  },
};

export const logoutRouteSchema = {
  body: schemaRefresh,
  response: {
    200: messageResponseSchema,
    400: errorResponseSchema,
  },
};

export type tRegisterInput = z.infer<typeof schemaRegister>;
