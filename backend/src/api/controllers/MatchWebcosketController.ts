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
// 1) пытаемся взять токен из query
						const token = (request.query as any).token as string | undefined;
						if (!token) {
							console.log('NO TOKEN');
							reply.code(401).send({ error: 'Unauthorized: no token' });
							throw new Error('No token');
						}
							console.log('TOKEN: ', token);
						// 2) верифицируем его явно
						try {
							// request.jwtVerify умеет принимать опцию { token }
							  const payload = fastify.jwt.verify(token);
            // сохраняем payload в request.user, как это делает request.jwtVerify()
            		(request as any).user = payload;
						} catch (err) {
							reply.code(401).send({ error: 'Unauthorized: invalid token' });
							throw err;
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