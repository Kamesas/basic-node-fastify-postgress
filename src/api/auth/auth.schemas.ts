import { z } from "zod";
import { errorResponseSchema, messageResponseSchema } from "../common.schemas";

export const schemaLogin = z.object({
  email: z.email("Invalid email format").meta({
    description: "User's email address",
    example: "user@example.com",
  }),
  password: z.string().min(8, "Password must be at least 8 characters").meta({
    description: "User's password (minimum 8 characters)",
    example: "SecurePass123",
  }),
});

export const schemaRegister = schemaLogin.extend({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    )
    .meta({
      description:
        "Unique username (3-30 characters, letters, numbers, underscores only)",
      example: "john_doe",
    }),
  displayName: z
    .string()
    .min(1, "display name cannot be empty")
    .max(100, "Display name must be at most 100 characters")
    .optional()
    .meta({
      description: "User's display name",
      example: "John Doe",
    }),
});

const loginDataSchema = z.object({
  user: z.object({
    id: z.number().meta({ description: "User ID" }),
    username: z.string().meta({ description: "Username" }),
    email: z.string().nullable().meta({ description: "Email address" }),
    displayName: z.string().nullable().meta({ description: "Display name" }),
    createdAt: z.string().meta({ description: "Account creation timestamp" }),
  }),
  accessToken: z.string().meta({ description: "JWT access token" }),
  refreshToken: z
    .string()
    .meta({ description: "JWT refresh token for mobile apps" }),
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

export type tRegisterInput = z.infer<typeof schemaRegister>;
