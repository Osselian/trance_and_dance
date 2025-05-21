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

		this.resetBall();

		this.gameInterval = setInterval(() => {
			this.updateGameState(0.05); // 50 ms
			this.broadcastGameState();
		}, 50);
	}

	public stopGame(): void {
		if (this.gameInterval) {
			clearInterval(this.gameInterval);
			this.gameInterval = null;
		}
	}

	public handleClientMessage(playerId: number, message: string): void {
		const data = JSON.parse(message);
		if (data.type === 'move') {
			const direction = data.direction;
			const paddle = playerId === 1 ? this.playerPaddle : this.opponentPaddle;

			if (direction === 'up') {
				paddle.move('up', 600);
			} else if (direction === 'down') {
				paddle.move('down', 600);
			}
		}
	}

	private updateGameState(deltaTime: number): void {
		this.ball.update(800, 600, deltaTime);

		this.playerPaddle.update(600, deltaTime);
		this.opponentPaddle.update(600, deltaTime);
		this.checkCollisions();
		this.checkScore();
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

		if (ballPos.x - ballSize / 2 <= 0) {
			this.score.incrementOpponent();
			this.resetBall();
		} else if (ballPos.x + ballSize / 2 >= 800) {
			this.score.incrementPlayer();
			this.resetBall();
		}

		if (this.score.hasWinner()) {
			this.stopGame();
		}
	}

	private resetBall(): void {
		this.ball.reset();
	}

	private broadcastGameState(): void {
		const state = {
			ball: this.ball.getPosition(),
			playerPaddle: this.playerPaddle.getPosition(),
			opponentPaddle: this.opponentPaddle.getPosition(),
			score: this.score.getScore(),
		};

		const stateString = JSON.stringify(state);
		this.clients.forEach((client) => client.send(stateString));
	}
}