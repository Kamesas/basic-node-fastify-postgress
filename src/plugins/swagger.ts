import { FastifyPluginAsync } from "fastify";
import fastifyPlugin from "fastify-plugin";
import {
  fastifyZodOpenApiPlugin,
  fastifyZodOpenApiTransformers,
} from "fastify-zod-openapi";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import { config, isDevelopment } from "../config";

const swaggerPlugin: FastifyPluginAsync = async (fastify) => {
  // Register Zod OpenAPI plugin
  await fastify.register(fastifyZodOpenApiPlugin);

  // Register Swagger with OpenAPI spec
  await fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: "Basic Auth API",
        description:
          "Authentication and user management API with email/password and OAuth support",
        version: "1.0.0",
      },
      servers: [
        {
          url: isDevelopment ? "http://localhost:3000" : config.frontendUrl,
          description: isDevelopment
            ? "Development server"
            : "Production server",
        },
      ],
      tags: [
        { name: "auth", description: "Authentication endpoints" },
        { name: "users", description: "User management endpoints" },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
          cookieAuth: {
            type: "apiKey",
            in: "cookie",
            name: "accessToken",
          },
        },
      },
    },
    ...fastifyZodOpenApiTransformers,
  });

  // Register Swagger UI
  await fastify.register(fastifySwaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
      persistAuthorization: true,
    },
  });
};

export default fastifyPlugin(swaggerPlugin, {
  name: "swagger",
});
