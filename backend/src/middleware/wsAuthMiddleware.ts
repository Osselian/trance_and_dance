import { FastifyRequest } from 'fastify';
import { WebSocket } from '@fastify/websocket';

export function wsAuthMiddleware(
	handler: (socket: WebSocket, request: FastifyRequest, userId: number) => void) 
{
  return async (connection: { socket: WebSocket }, request: FastifyRequest) =>  {
    try {
		await request.jwtVerify();
		const userId = (request as any).user.id as number;
		// Передаем управление основному обработчику
		handler(connection.socket, request, userId);
    } catch (err) {
      connection.socket.close(1008, 'Invalid token');
    }
  };
}