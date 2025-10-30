import { z } from "zod";
import { successResponseSchema, errorResponseSchema } from "../common.schemas";

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),
  password: z.string().min(8, "Password must be at least 8 characters"),
  email: z.email("Invalid email format").optional(),
  displayName: z
    .string()
    .min(1, "Display name cannot be empty")
    .max(100, "Display name must be at most 100 characters")
    .optional(),
});

const registerDataSchema = z.object({
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

export const registerRouteSchema = {
  body: registerSchema,
  response: {
    201: successResponseSchema(registerDataSchema),
    400: errorResponseSchema,
    409: errorResponseSchema,
  },
};

export type tRegisterInput = z.infer<typeof registerSchema>;
