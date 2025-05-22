import { Game } from "../pong/Game";

export class GameService {
	private clients: Map<number, WebSocket> = new Map();
	private gameInterval: NodeJS.Timeout | null = null;
	private game: Game;

	constructor() {
		this.game = new Game();
	}

	public addClient(playerId: number, socket: WebSocket): void {
		this.clients.set(playerId, socket);
	}

	public handleClientMessage(playerId: number, message: string): void {
		const data = JSON.parse(message);
		
		switch (data.type) {
			case 'move':
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


	private broadcastGameState(): void {
		const state = this.game.getState();
		const stateString = JSON.stringify(state);
		this.clients.forEach((client) => client.send(stateString));
	}
}