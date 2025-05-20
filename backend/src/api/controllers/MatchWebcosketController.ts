import { FastifyInstance, FastifyRequest  } from "fastify";
import fastifyWebsocket from "@fastify/websocket";
import { MatchWebSocketService } from "../../services/MatchWebsocketService";
import { wsAuthMiddleware } from "../../middleware/wsAuthMiddleware";

export class MatchWebSocketController {
	constructor(
		private fastify: FastifyInstance,
		private wbService: MatchWebSocketService
	){}

	public registerRoutes() {
		this.fastify.register(fastifyWebsocket);
		this.fastify.get(
			'/ws',
			{ websocket: true },
			wsAuthMiddleware((socket: WebSocket, request, userId: number) => {
				this.handleNewConnection(socket, request, userId);
			})
		);	
	}
	
	private async handleNewConnection(socket: WebSocket, request: FastifyRequest, userId: number) {
		this.wbService.handleNewConnection(
			socket,
			request.raw.url!,
			request.headers as any,
			userId
		);
	}
}