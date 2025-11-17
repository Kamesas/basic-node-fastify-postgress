import fp from "fastify-plugin";
import cors from "@fastify/cors";
import { config, isDevelopment } from "../config";

export default fp(async (fastify) => {
  await fastify.register(cors, {
    origin: isDevelopment
      ? true // Allow all origins in development (for Swagger UI and testing)
      : config.frontendUrl, // Restrict to frontend URL in production
    credentials: true, // Required for cookies to work across origins
  });
});
