import { FastifyInstance } from 'fastify';

export default async function otpRoutes(fastify: FastifyInstance) {
  fastify.post('/otp/generate', async (request, reply) => {
    // Your implementation here
  });

  fastify.post('/otp/validate', async (request, reply) => {
    // Your implementation here
  });
}