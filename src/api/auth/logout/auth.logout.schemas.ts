import {
  messageResponseSchema,
  errorResponseSchema,
} from "../../common.schemas";
import { schemaRefresh } from "../tokens/auth.tokens.schemas";

export const logoutRouteSchema = {
  body: schemaRefresh,
  response: {
    200: messageResponseSchema,
    400: errorResponseSchema,
  },
};

export const logoutAllRouteSchema = {
  body: schemaRefresh,
  response: {
    200: messageResponseSchema,
    400: errorResponseSchema,
    401: messageResponseSchema,
  },
};
