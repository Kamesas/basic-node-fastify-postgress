import z from "zod";
import {
  errorResponseSchema,
  messageResponseSchema,
} from "../../common.schemas";

export const schemaRefresh = z.object({
  refreshToken: z.string().optional(),
});

const tokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(), // For mobile apps
});

export const refreshRouteSchema = {
  body: schemaRefresh,
  response: {
    200: tokensSchema,
    400: errorResponseSchema,
    401: messageResponseSchema,
  },
};
