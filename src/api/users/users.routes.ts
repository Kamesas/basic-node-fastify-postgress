import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { getUsers } from "./users.models";
import { getUsersRouteSchema } from "./users.shchemas";

export default function usersRoutes(fastify: FastifyInstance) {
  const f = fastify.withTypeProvider<ZodTypeProvider>();

  f.get("/users/me", async (_request, reply) => {
    return reply.code(501).send({
      message: "Get current user endpoint - not implemented yet",
    });
  });

  f.patch("/users/me", async (_request, reply) => {
    return reply.code(501).send({
      message: "Update current user endpoint - not implemented yet",
    });
  });

  f.get("/users", { schema: getUsersRouteSchema }, async (_request, reply) => {
    const users = await getUsers();
    return reply.code(200).send(users);
  });
}
