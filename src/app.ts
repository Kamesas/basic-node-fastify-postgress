import AutoLoad, { AutoloadPluginOptions } from "@fastify/autoload";
import { FastifyPluginAsync, FastifyServerOptions } from "fastify";
import { join } from "node:path";
import helmet from "@fastify/helmet";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import usersRoutes from "./api/users/users.routes";
import authRoutes from "./api/auth/auth.routes";

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

  // Zod validation
  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  // Routes
  fastify.register(usersRoutes, { prefix: "/api" });
  fastify.register(authRoutes, { prefix: "/api" });
  // Plugins
  // eslint-disable-next-line no-void
  void fastify.register(AutoLoad, {
    dir: join(__dirname, "plugins"),
    options: opts,
  });
};

export default app;
export { app, options };
