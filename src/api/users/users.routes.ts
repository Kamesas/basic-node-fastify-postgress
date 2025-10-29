import { FastifyInstance } from "fastify";
import { getUsersFromDb, createUserInDb } from "./users.models";

export default function usersRoutes(fastify: FastifyInstance) {
  fastify.get("/users", async (_request, reply) => {
    const users = await getUsersFromDb();
    return reply.code(200).send(users);
  });

  fastify.post("/users", async (request, reply) => {
    const body = request.body;
    console.log("body:", body);

    const newUser = await createUserInDb(body);
    return reply.code(200).send(newUser);
  });
}
