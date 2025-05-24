import { Game } from "../pong/Game";
import { WebSocket } from '@fastify/websocket';

export class GameService {
	private clients: Map<number, WebSocket> = new Map();
	private gameInterval: NodeJS.Timeout | null = null;
	private game: Game;
	private playersReady: Set<number> = new Set();

	constructor() {
		this.game = new Game();
	}

	public addClient(playerId: number, socket: WebSocket): void {
		this.clients.set(playerId, socket);
	}

	public handleClientMessage(playerId: number, message: string): void {
		const data = JSON.parse(message);
		
		switch (data.type) {
			case 'ready':
				this.markPlayerReady(playerId);
				break;
			case 'move':
				if (data.direction && typeof data.direction === 'string') 
					this.game.handlePlayerInput(data.direction, playerId);
				break;
			case 'start':
				this.startGame();
				break;
			case 'pause':
				this.pauseGame();
				break;
			case 'resume':
				this.resumeGame();
				break;
			case 'reset':
				this.resetGame();
				break;
		}
	}

	public markPlayerReady(playerId: number): void {
		this.playersReady.add(playerId);

		//Оповещаем всех игроков о новом статусе готовности
		const readyStatus = {
			type: 'readyStatus',
			playersReady: Array.from(this.playersReady),
			allReady: this.playersReady.size === 2
		};

		this.clients.forEach((client) => 
			client.send(JSON.stringify(readyStatus)));

		//Если все игроки готовы, запускаем игру
		if (this.playersReady.size === 2) {
			//Отправляем сообщение о начале игры
			const gameStartMessage = {
				type: 'gameStart',
				timeStamp: Date.now()
			};

			this.clients.forEach((client) => {
				client.send(JSON.stringify(gameStartMessage));
			});

			//Начинаем игру с небольшой задержкой
			setTimeout(() => {
				this.startGame();
			}, 1000);
		}
	}

	private startGame(): void {
		if (this.gameInterval) return;
		
		this.game.start();

		this.gameInterval = setInterval(() => {
			this.game.updateState(0.05); // 50 ms
			this.broadcastGameState();
		}, 50);
	}

	public pauseGame(): void {
		this.game.pause();
		if (this.gameInterval) {
			clearInterval(this.gameInterval);
			this.gameInterval = null;
		}
	}

	public resumeGame(): void {
		this.startGame();
	}


	public resetGame(): void {
		this.game.reset();
	}
//под вопросом
	public stopGame(): void {
		if (this.gameInterval) {
			clearInterval(this.gameInterval);
			this.gameInterval = null;
		}

		this.game.stopGame();

		const gameStopMessage = {
			type: 'gameStop',
			reason: 'playerDisconnected',//убрать
			timeStamp: Date.now()
		};
		this.clients.forEach((client) => {
			client.send(JSON.stringify(gameStopMessage));
		}
		);
		this.playersReady.clear();
	}


	private broadcastGameState(): void {
		try {
			const state = this.game.getState();
			const stateString = JSON.stringify(state);
			this.clients.forEach((client) => {
				try {
					client.send(stateString);
				}
				catch (error) {
					console.error("Error sending game state to client:", error);
				}
			});
		}
		catch (error) {
			console.error("Error broadcasting game state:", error);
		}
	}
}