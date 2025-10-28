import { FastifyInstance } from "fastify";

// Mock async function to simulate database call
async function getUsersFromDb(): Promise<string[]> {
  return Promise.resolve(["user1", "user2", "user3"]);
}

export default function usersRoutes(fastify: FastifyInstance) {
  fastify.get("/users", async (_request, reply) => {
    const users = getUsersFromDb();
    return reply.code(200).send(users);
  });

  fastify.post("/users", async (request, reply) => {
    const body = request.body;
    console.log("body:", body);

    return reply.code(200).send("users");
  });
}
