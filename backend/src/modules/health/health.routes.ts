import { FastifyInstance } from 'fastify';

export async function healthRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/health
   * Returns server liveness status
   */
  fastify.get('/health', async () => {
    return { status: 'ok' };
  });

  /**
   * GET /api/db-test
   * Returns current DB timestamp to verify connection
   */
  fastify.get('/db-test', async (request, reply) => {
    try {
      const result = await fastify.db.query('SELECT NOW()');
      return { status: 'ok', timestamp: result.rows[0].now };
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ status: 'error', message: 'Database query failed' });
    }
  });
}
