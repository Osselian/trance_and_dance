import { Ball } from './Ball';
import { Paddle } from './Paddle';
import { Score } from './Score';
import { GamesStateDto } from './GamesStateDto';

export class Game {
	private ball: Ball;
	private player1Paddle: Paddle;
	private player2Paddle: Paddle;
	private score: Score;
	private targetPaddlePositions: { player: number; computer: number } | null = null;
	private gameState: string = 'READY'; // Возможные значения: 'READY', 'PLAYING', 'PAUSED', 'GAME_OVER'
  	private isWaitingForBallSpawn: boolean = false;
  	private lastScoreTime: number = 0;
	private readonly SCORE_DELAY = 1000; // 1 second delay

	constructor() {
		this.ball = new Ball();
		this.player1Paddle = new Paddle(50, true);
		this.player2Paddle = new Paddle(750, false);
		this.score = new Score();
	}

	public start(){
	//	this.isGameStartCountdown = true;
		this.gameState = 'PLAYING';
		this.lastScoreTime = Date.now();
		this.ball.hide(); // Hide ball during countdown
		this.startPaddleReset(); // Start smooth paddle reset
	}

	public pause(): void {
		if (this.gameState === 'PLAYING') {
			this.gameState = 'PAUSED';
		}
	}

	public updateState(deltaTime: number): void {
		if (this.gameState !== 'PLAYING') return;

		this.ball.update(800, 600, deltaTime);
		this.player1Paddle.update(600, deltaTime);
		this.player2Paddle.update(600, deltaTime);
		
		this.updatePaddlePositions(deltaTime);
		this.checkCollisions();
		this.checkScore();
	}
		
	public reset(){
		this.score.reset();
		this.resetBall();
		this.targetPaddlePositions = null;
		this.gameState = 'READY';
		this.isWaitingForBallSpawn = false;
	}		

	public handlePlayerInput(direction: string, playerId: number): void {
		if (this.gameState !== 'PLAYING') return;

		// const direction = data.direction;
		const paddle = playerId === 1 ? this.player1Paddle : this.player2Paddle;

		if (direction === 'up') {
			paddle.move('up', 600);
		} else if (direction === 'down') {
			paddle.move('down', 600);
		} else if (direction === 'stop') {
			paddle.stop();
		}
	}

	public getState(): GamesStateDto {
		const state = 
		{
			ballPos: this.isWaitingForBallSpawn ? null : this.ball.getPosition(),
			player1PaddlePos: this.player1Paddle.getPosition(),
			player2PaddlePos: this.player2Paddle.getPosition(),
			score: this.score.getScore(),
			gameState: this.gameState,
			isWaitingForBallSpawn: this.isWaitingForBallSpawn,
			lastScoreTime: this.lastScoreTime,
			hasWinner: this.score.hasWinner(),
			winnerId: this.score.getWinner()
		} as GamesStateDto;

		return state;
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
		[this.player1Paddle, this.player2Paddle].forEach((paddle) => {
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

	public stopGame(): void {
		this.gameState = 'GAME_OVER';
	}

	private resetBall(): void {
		this.ball.reset();
	}

	private resetPaddles(): void {
		this.player1Paddle.reset(600);
		this.player2Paddle.reset(600);
	}

	private startPaddleReset(): void {
		// Just set the flag to trigger reset at midpoint
		this.targetPaddlePositions = { player: 0, computer: 0 };
	}
}