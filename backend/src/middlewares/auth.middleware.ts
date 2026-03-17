import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Auth Middleware (Placeholder)
 * Attach this as a preHandler hook to protect routes.
 * TODO: Implement JWT verification when auth module is ready.
 */
export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Example: const token = request.headers.authorization;
  // Verify token here
}
