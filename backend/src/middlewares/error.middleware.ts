import { FastifyError, FastifyRequest, FastifyReply } from 'fastify';

/**
 * Error Middleware (Placeholder)
 * Register this as a setErrorHandler on the Fastify instance.
 * TODO: Expand with structured error responses as the project grows.
 */
export function errorMiddleware(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  const statusCode = error.statusCode ?? 500;

  request.log.error(error);

  reply.status(statusCode).send({
    status: 'error',
    message: error.message || 'Internal Server Error',
  });
}
