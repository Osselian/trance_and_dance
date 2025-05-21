import { Ball } from '../pong/Ball';
import { Paddle } from '../pong/Paddle';
import { Score } from '../pong/Score';

export class GameService {
	private ball: Ball;
	private playerPaddle: Paddle;
	private opponentPaddle: Paddle;
	private score: Score;
	private clients: Map<number, WebSocket> = new Map();
	private gameInterval: NodeJS.Timeout | null = null;
  	private isWaitingForBallSpawn: boolean = false;
  	private lastScoreTime: number = 0;
  	private targetPaddlePositions: { player: number; computer: number } | null = null;
	private readonly SCORE_DELAY = 1000; // 1 second delay
	private gameState: string = 'READY'; // Возможные значения: 'READY', 'PLAYING', 'PAUSED', 'GAME_OVER'
	private gameMode: string | null = null; // 'VS_COMPUTER' или 'VS_PLAYER'
	private isGameStartCountdown: boolean = false;

	constructor() {
		this.ball = new Ball();
		this.playerPaddle = new Paddle(50, true);
		this.opponentPaddle = new Paddle(750, false);
		this.score = new Score();
	}

	public addClient(playerId: number, socket: WebSocket): void {
		this.clients.set(playerId, socket);
	}

	public startGame(): void {
		if (this.gameInterval) return;
		
		this.gameState = 'PLAYING';
		this.isGameStartCountdown = true;
		this.lastScoreTime = Date.now();
		this.ball.hide(); // Hide ball during countdown
		this.startPaddleReset(); // Start smooth paddle reset

		this.gameInterval = setInterval(() => {
			this.updateGameState(0.05); // 50 ms
			this.broadcastGameState();
		}, 50);
	}

	public pauseGame(): void {
		if (this.gameState === 'PLAYING') {
			this.gameState = 'PAUSED';
			if (this.gameInterval) {
				clearInterval(this.gameInterval);
				this.gameInterval = null;
			}
		}
	}

	public resumeGame(): void {
		if (this.gameState === 'PAUSED') {
			this.gameState = 'PLAYING';
			this.startGame();
		}
	}

	public stopGame(): void {
		if (this.gameInterval) {
			clearInterval(this.gameInterval);
			this.gameInterval = null;
		}
		this.gameState = 'GAME_OVER';
	}

	public resetGame(): void {
		this.score.reset();
		this.resetBall();
		this.targetPaddlePositions = null;
		this.gameState = 'READY';
		this.isGameStartCountdown = false;
		this.isWaitingForBallSpawn = false;
	}

	public setGameMode(mode: string): void {
		this.gameMode = mode;
	}

	public handleClientMessage(playerId: number, message: string): void {
		const data = JSON.parse(message);
		
		switch (data.type) {
			case 'move':
				if (this.gameState !== 'PLAYING') return;
				
				const direction = data.direction;
				const paddle = playerId === 1 ? this.playerPaddle : this.opponentPaddle;
				
				if (direction === 'up') {
					paddle.move('up', 600);
				} else if (direction === 'down') {
					paddle.move('down', 600);
				} else if (direction === 'stop') {
					paddle.stop();
				}
				break;
				
			case 'start':
				this.setGameMode(data.mode || 'VS_PLAYER');
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

	private updateComputerPaddle(deltaTime: number): void {
		if (this.targetPaddlePositions) {
			return;
		}

		const ballPos = this.ball.getPosition();
		const paddlePos = this.opponentPaddle.getPosition();
		const paddleSize = this.opponentPaddle.getSize();
		const paddleCenter = paddlePos.y + paddleSize.height / 2;

		// Целевая позиция — либо за мячом, либо к центру
		let targetY: number;
		if (this.ball.getVelocity().x > 0) {
			// Мяч летит к компьютеру — следуем за ним
			targetY = ballPos.y;
		} else {
			// Мяч летит от компьютера — возвращаемся к центру
			targetY = 300; // Середина поля высотой 600
		}

		// Ограничиваем скорость движения ИИ
		const maxSpeed = 300; // пикселей в секунду
		const distance = targetY - paddleCenter;
		const move = Math.sign(distance) * Math.min(Math.abs(distance), maxSpeed * deltaTime);

		this.opponentPaddle.setCenterY(paddleCenter + move, 600);
		this.opponentPaddle.update(600, deltaTime);
	}

	private updateGameState(deltaTime: number): void {
		if (this.gameState !== 'PLAYING') return;

		this.ball.update(800, 600, deltaTime);
		this.playerPaddle.update(600, deltaTime);
		
		if (this.gameMode === 'VS_COMPUTER') {
			this.updateComputerPaddle(deltaTime);
		} else {
			this.opponentPaddle.update(600, deltaTime);
		}
		
		this.updatePaddlePositions(deltaTime);
		this.checkCollisions();
		this.checkScore();
	}

	private updatePaddlePositions(deltaTime: number): void {
		if (this.targetPaddlePositions) {
			const currentTime = Date.now();
			const timeElapsed = currentTime - this.lastScoreTime;
			
			// Reset paddles instantly at the midpoint of countdown
			if (timeElapsed >= this.SCORE_DELAY / 2) {
				this.resetPaddles();
				this.targetPaddlePositions = null;
			}
		}
	}

	private checkCollisions(): void {
		const ballPos = this.ball.getPosition();
		const ballSize = this.ball.getSize();
		const ballVel = this.ball.getVelocity();

		// Check paddle collisions
		[this.playerPaddle, this.opponentPaddle].forEach((paddle) => {
			const paddlePos = paddle.getPosition();
			const paddleSize = paddle.getSize();

			// Check if ball is colliding with paddle
			if (
				ballPos.x + ballSize / 2 >= paddlePos.x &&
				ballPos.x - ballSize / 2 <= paddlePos.x + paddleSize.width &&
				ballPos.y + ballSize / 2 >= paddlePos.y &&
				ballPos.y - ballSize / 2 <= paddlePos.y + paddleSize.height
			) {
				// Determine which part of the paddle was hit
				const isPlayerPaddle = paddle.isPlayerPaddle();
				const paddleCenterX = isPlayerPaddle ? paddlePos.x + paddleSize.width : paddlePos.x;
				const paddleCenterY = paddlePos.y + paddleSize.height / 2;

				// Calculate relative position of ball to paddle center
				const relativeY = (ballPos.y - paddleCenterY) / (paddleSize.height / 2);

				// Check if ball hit the side of the paddle
				const hitSide = isPlayerPaddle
					? ballPos.x + ballSize / 2 <= paddlePos.x + paddleSize.width / 4
					: ballPos.x - ballSize / 2 >= paddlePos.x + (paddleSize.width * 3) / 4;

				if (hitSide) {
					// Side hit - ball bounces off the side wall
					this.ball.reverseX();
					// Add some vertical velocity based on where it hit the paddle
					this.ball.setVelocityY(relativeY * this.ball.getCurrentSpeed());
				} else {
					// Front hit - normal paddle hit
					this.ball.reverseX();
					// Add some vertical velocity based on where it hit the paddle
					this.ball.setVelocityY(relativeY * this.ball.getCurrentSpeed());
				}
			}
		});
	}

	private checkScore(): void {
		const ballPos = this.ball.getPosition();
		const ballSize = this.ball.getSize();
		const currentTime = performance.now();

		// Only check for scoring if we're not waiting for ball spawn
		if (!this.isWaitingForBallSpawn) {
			if (ballPos.x - ballSize / 2 <= 0) {
				this.score.incrementOpponent();
				this.lastScoreTime = currentTime;
				this.ball.hide();
				this.isWaitingForBallSpawn = true;
				this.startPaddleReset();
			} else if (ballPos.x + ballSize / 2 >= 800) {
				this.score.incrementPlayer();
				this.lastScoreTime = currentTime;
				this.ball.hide();
				this.isWaitingForBallSpawn = true;
				this.startPaddleReset();
			}
		}

		// Reset ball after delay
		if (this.isWaitingForBallSpawn && currentTime - this.lastScoreTime >= this.SCORE_DELAY) {
			this.resetBall();
			this.lastScoreTime = 0;
			this.isWaitingForBallSpawn = false;
			this.targetPaddlePositions = null;
		}

		if (this.score.hasWinner()) {
			this.stopGame();
		}
	}

	private resetBall(): void {
		this.ball.reset();
	}

	private resetPaddles(): void {
		this.playerPaddle.reset(600);
		this.opponentPaddle.reset(600);
	}

	private startPaddleReset(): void {
		// Just set the flag to trigger reset at midpoint
		this.targetPaddlePositions = { player: 0, computer: 0 };
	}

	private broadcastGameState(): void {
		const state = {
			ball: this.isWaitingForBallSpawn ? null : this.ball.getPosition(),
			playerPaddle: this.playerPaddle.getPosition(),
			opponentPaddle: this.opponentPaddle.getPosition(),
			score: this.score.getScore(),
			gameState: this.gameState,
			gameMode: this.gameMode,
			isWaitingForBallSpawn: this.isWaitingForBallSpawn,
			lastScoreTime: this.lastScoreTime,
			hasWinner: this.score.hasWinner(),
			winner: this.score.getWinner()
		};

		const stateString = JSON.stringify(state);
		this.clients.forEach((client) => client.send(stateString));
	}
}