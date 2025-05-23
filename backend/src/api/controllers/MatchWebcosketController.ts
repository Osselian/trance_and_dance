import { WebSocket} from 'ws';
import { FastifyInstance, FastifyReply, FastifyRequest} from "fastify";
import { MatchWebSocketService } from "../../services/MatchWebsocketService";

export class MatchWebSocketController {
    constructor(
        private fastify: FastifyInstance,
    ){}

    public async registerRoutes(wbService: MatchWebSocketService) {
		this.fastify.register( async function (fastify) {
			// Настраиваем маршрут с preHandler для проверки JWT
			fastify.get(
				'/ws', 
				{
					websocket: true,
					preHandler: async (request: FastifyRequest, reply: FastifyReply) => {
						try {
							await request.jwtVerify();
						} catch (err) {
							reply.code(401).send({ error: 'Unauthorized' });
							throw err; // прерываем дальнейшую обработку
						}
					}
				}, 
				(connection: WebSocket, req: FastifyRequest) => 
				{
					try {
						wbService.handleNewConnection(connection, req)
					}
					catch (error) {
						console.error('WebSocket handler error:', error);
						try {
							connection.close(1011, 'Internal server error');
						} catch (e) {
							console.error('Failed to close socket:', e);
						}
					}
				});
		});
    }
}