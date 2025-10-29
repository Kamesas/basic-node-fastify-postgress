import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { getUsers, createUser } from "./users.models";
import { getUsersRouteSchema, createUserRouteSchema } from "./users.shchemas";

export default function usersRoutes(fastify: FastifyInstance) {
  const f = fastify.withTypeProvider<ZodTypeProvider>();

  f.get("/users", { schema: getUsersRouteSchema }, async (_request, reply) => {
    const users = await getUsers();
    return reply.code(200).send(users);
  });

  f.post(
    "/users",
    { schema: createUserRouteSchema },
    async (request, reply) => {
      const body = request.body;
      console.log("body:", body);

      const newUser = await createUser(body);
      return reply.code(200).send(newUser);
    }
  );
}
