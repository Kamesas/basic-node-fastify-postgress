import { FastifyInstance } from "fastify"

export default function usersRoutes(fastify: FastifyInstance) {
  fastify.get('/users', async (request, reply) => {
    return reply.code(200).send('users');
  })

  fastify.post('/users', async (request, reply) => {
    const body = request.body; 
    console.log('body:', body)

    return reply.code(200).send('users');
  })
}
