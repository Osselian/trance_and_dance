import { GameService } from './GameService';
import { MatchmakingService } from './MatchmakingService'
import { WebSocket } from '@fastify/websocket';

type SocketWithUser = WebSocket & { userId: number; matchId: number};

export class MatchWebSocketService {
	//словарь игровых комнат
	private rooms: Map<number, Set<SocketWithUser>> = new Map();
	private games: Map<number, GameService> = new Map();

	constructor(private matchService = new MatchmakingService()) {}

	public async handleNewConnection(
		socket: WebSocket,
		rawRequestUrl: string,
		rawHeaders: Record<string, string | string[]>,
		userId: number) {
		try 
		{
			const matchId = await this.getMatchId(rawHeaders, rawRequestUrl, socket, userId);
			if (!matchId)
				return;

			const typedSocket = this.fillRoom(socket, userId, matchId);
			this.socketEventsSubscribtion(typedSocket);
			this.notifyOnConnection(typedSocket, userId, matchId, this.rooms.get(matchId)!);
		}
		catch {
			socket.close(1011, 'Unexpected error');
		}
	}

	private async getMatchId(
		rawHeaders: Record<string, string | string[]>, 
		rawRequestUrl: string, 
		socket: WebSocket,
		userId: number): Promise< number | undefined>
	{
		//извлечение токена из запроса
		const host = Array.isArray(rawHeaders.host)
			? rawHeaders.host[0]
			: rawHeaders.host;

		const url = new URL(rawRequestUrl, `https://${host}`);
		const matchIdParam = url.searchParams.get('matchId');
		if (!matchIdParam) {
			socket.close(1008, 'No token or matchId');
			return;
		}

		//валидация matchId
		const matchId = parseInt(matchIdParam, 10);
		if (isNaN(matchId)) {
			socket.close(1008, 'Invalid matchId');
			return;
		}
		//проверка, что игрок действительно участвует в данном матче
		const isParticipant = await this.matchService.userHasMatch(userId, matchId);
		if (!isParticipant) {
			socket.close(1008, 'User not in this match');
			return;
		}

		return matchId;
	}

	private fillRoom(socket: WebSocket, userId: number, matchId: number): SocketWithUser {
		//привязка полей к сокету
		const typedSocket = socket as SocketWithUser;
		typedSocket.userId = userId;
		typedSocket.matchId = matchId;

		//добавляем сокет в комнату, команту в словарь
		let room = this.rooms.get(matchId);
		if (!room) {
			room = new Set();
			this.rooms.set(matchId, room);

			// Создаем новый экземпляр GameService для этой комнаты
			const gameService = new GameService();
			this.games.set(matchId, gameService);
		}
		// Добавляем сокет в комнату
		room.add(typedSocket);
		let game = this.games.get(matchId);
		game?.addClient(userId, typedSocket);

		return typedSocket;
	}

	private notifyOnConnection(
		typedSocket: SocketWithUser,
		userId: number,
		matchId: number,
		room: Set<SocketWithUser>) 
	{
		typedSocket.send(JSON.stringify({
			type: 'connection',
			status: 'connected',
			playerId: userId,
			playerNumber: room.size,
			roomId: matchId,
			playersConnected: room.size,
			playersNeeded: 2
		}));

		for (const client of room) {
			if (client !== typedSocket) {
				client.send(JSON.stringify({
					type: 'playerConnected',
					playersConnected: room.size,
					playersNeeded: 2
				}));
			}
		}

	}

	private socketEventsSubscribtion(socket: SocketWithUser) {
		// Обработчик входящих сообщений
		socket.on('message', (rawMessage: string) => {
			this.handleIncomingMessage(socket, rawMessage);
		});

		// Обработка закрытия соединения
		socket.on('close', () => {
			this.removeFromRoom(socket);
		});
	}

	private handleIncomingMessage(socket: SocketWithUser, rawMessage: string) {
		let msg: any;
		try {
			msg = JSON.parse(rawMessage);
		} catch{
			return;
		}

		const room = this.rooms.get(socket.matchId);
		if (!room) return;

		const game = this.games.get(socket.matchId);
		if (!game) 
			return;

		try {
			game.handleClientMessage(socket.userId, msg);
		}
		catch (error) {
			socket.send(JSON.stringify({
				type: 'error',
				message: 'Invalid message format'
			}));
			return;
		}
	}

	private removeFromRoom(socket: SocketWithUser) {
		const room = this.rooms.get(socket.matchId);
		if (room) {
			room.delete(socket);
			if (room.size === 0) {
				this.rooms.delete(socket.matchId);

				const game = this.games.get(socket.matchId);
				if (game) {
					game.stopGame();
					this.games.delete(socket.matchId);
				}
			}
		}
	}
}