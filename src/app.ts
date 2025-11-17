import AutoLoad, { AutoloadPluginOptions } from "@fastify/autoload";
import { FastifyPluginAsync, FastifyServerOptions } from "fastify";
import { join } from "node:path";
import helmet from "@fastify/helmet";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import {
  fastifyZodOpenApiPlugin,
  fastifyZodOpenApiTransformers,
} from "fastify-zod-openapi";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import usersRoutes from "./api/users/users.routes";
import authRoutes from "./api/auth/auth.routes";
import { config, isDevelopment } from "./config";

export interface AppOptions
  extends FastifyServerOptions,
    Partial<AutoloadPluginOptions> {}

const options: AppOptions = {};

const app: FastifyPluginAsync<AppOptions> = async (
  fastify,
  opts
): Promise<void> => {
  // Security headers
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
      },
    },
  });

  // OpenAPI/Swagger documentation
  await fastify.register(fastifyZodOpenApiPlugin);
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

  await fastify.register(fastifySwaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
      persistAuthorization: true,
    },
  });

  // Zod validation
  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  // Routes
  fastify.register(usersRoutes, { prefix: "/api" });
  fastify.register(authRoutes, { prefix: "/api/auth" });
  // Plugins
  // eslint-disable-next-line no-void
  void fastify.register(AutoLoad, {
    dir: join(__dirname, "plugins"),
    options: opts,
  });
};

export default app;
export { app, options };
