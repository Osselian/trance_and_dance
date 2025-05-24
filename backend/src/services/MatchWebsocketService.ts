import { FastifyRequest } from 'fastify';
import { GameService } from './GameService';
import { MatchmakingService } from './MatchmakingService'
import { WebSocket } from '@fastify/websocket';
import { TournamentMatchService } from './TournamentMatchService';
import { Match, TournamentMatch } from '@prisma/client';

type SocketWithUser = WebSocket & { userId: number; matchId: number};

export class MatchWebSocketService {
	private static instance: MatchWebSocketService;
	private rooms: Map<number, Set<SocketWithUser>> = new Map();
	private games: Map<number, GameService> = new Map();

	private userConnections: Map<number, {
		socketId: string,
		matchId: number,
		lastActivity: number,
		disconnectTimeout?: NodeJS.Timeout
	}> = new Map();

	private readonly RECONNECT_TIMEOUT = 60000; // 1 minute

	constructor(private matchService = new MatchmakingService())
	{
		MatchWebSocketService.instance = this;
	}

	public static getInstance(): MatchWebSocketService {
		// тут можно добавить проверку на существование экземпляра
		return MatchWebSocketService.instance;
	}

	public async handleNewConnection(socket: WebSocket, request: FastifyRequest) {
		try 
		{
			const userId = (request.user as any).id; 
			const matchId = await this.getMatchId(request, socket, userId);
			if (!matchId)
				return;

			//check is user was disconnected
			const existingConnection = this.userConnections.get(userId);
			if (existingConnection && existingConnection.disconnectTimeout) {
				clearTimeout(existingConnection.disconnectTimeout);
				console.log(`User ${userId} reconnected to match ${matchId}`);
			}

			//create unique socketId
			const socketId = `${userId}-${Date.now()}`;

			//register user connection
			this.userConnections.set(userId, {
				socketId,
				matchId,
				lastActivity: Date.now(),
				disconnectTimeout: undefined
			});

			const typedSocket = this.fillRoom(socket, userId, matchId);

			this.setupActivityTracking(typedSocket, userId);

			this.socketEventsSubscribtion(typedSocket);
			this.notifyOnConnection(typedSocket, userId, matchId, this.rooms.get(matchId)!);
		}
		catch {
			(socket as WebSocket).close(1011, 'Unexpected error');
		}
	}

	private setupActivityTracking(socket: SocketWithUser, userId: number) {
		//update last activity time
		const originalOnMessage = socket.onmessage;
		// Use the correct MessageEvent type from 'ws'
		const { MessageEvent } = require('ws');
		socket.onmessage = (event: InstanceType<typeof MessageEvent>) => {
			const connection = this.userConnections.get(userId);
			if (connection)
				connection.lastActivity = Date.now();

			if (originalOnMessage) {
				originalOnMessage.call(socket, event);
			}
		};

		//set ping for activity tracking
		const pingInterval = setInterval(() => {
			try {
				if (socket.readyState === socket.OPEN) {
					socket.send(JSON.stringify({ type: 'ping' }));
				} else {
					clearInterval(pingInterval);
				}
			} catch (error) {
				console.error('Error sending ping:', error);
				clearInterval(pingInterval);
			}
		}, 30000); // 30 seconds

		socket.addEventListener('close', () => {
			clearInterval(pingInterval);
			this.handleDisconnection(userId);
		});
	}	

	private handleDisconnection(userId: number) {
		const connection = this.userConnections.get(userId);
		if (!connection) return;

		console.log(`User ${userId} disconnected from match ${connection.matchId}`);

		const disconnectionTimeout = setTimeout(async () => {
			console.log(
				`User ${userId} failed to reconnect in time, declairing technical loss`);
			
				try {
					const match = await this.findMatchById(connection.matchId);
					if (!match) return;

					const tournamentMatch = await this
						.findTournamentMatchById(connection.matchId);
					if (!tournamentMatch) return;

					const opponentId = match.player1Id === userId 
						? match.player2Id
						: match.player1Id;
					
					const tournamentMatchService = new TournamentMatchService();
					await tournamentMatchService
						.awardTechnicalWin(tournamentMatch.id, opponentId);

					this.userConnections.delete(userId);
				} catch (error) {
					console.error('Error handling disconnection:', error);
				}
		}, this.RECONNECT_TIMEOUT);

		connection.disconnectTimeout = disconnectionTimeout;
	}

	private async findMatchById(matchId: number): Promise<Match | null> {
		const matchService = new MatchmakingService();
		return matchService.findMatchById(matchId);
	}

	private async findTournamentMatchById(matchId: number): Promise<TournamentMatch | null> {
		const tmService = new TournamentMatchService();
		return tmService.getTournamentMatch(matchId);
	}

	private async getMatchId(
		request: FastifyRequest,
		socket: WebSocket,
		userId: number): Promise< number | undefined>
	{
		const matchIdParam = (request.query as any).matchId;
		if (!matchIdParam) {
			(socket as WebSocket).close(1008, 'No token or matchId');
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
		const matchId = socket.matchId;
		const room = this.rooms.get(socket.matchId);
		if (room) {
			room.delete(socket);
			if (room.size === 0) {
				this.rooms.delete(socket.matchId);

				const game = this.games.get(matchId);
				if (game) {
					game.stopGame();
					this.games.delete(socket.matchId);
				}
			} else {
				//if one player left
				if (room.size === 1) {
					const remainingPlayer = Array.from(room)[0];
					remainingPlayer.send(JSON.stringify({
						type: 'playerDisconnected',
						message: 'Your opponent has disconnected. Waiting for reconnection...',
					}));
				}
			}
		}
	}

	public isUserConnectedToMatch(userId: number, matchId: number): boolean {
		const connection = this.userConnections.get(userId);
		if (!connection) return false;
		
		return connection.matchId === matchId && !connection.disconnectTimeout;
	}
}