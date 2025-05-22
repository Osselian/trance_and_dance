import { Ball } from '../pong/Ball';
import { Paddle } from '../pong/Paddle';
import { Score } from '../pong/Score';
import { canvasWidth, canvasHeight } from '../pong/constants';
import { GameState } from './GameState';

interface MoveMessage {
  type: 'move';
  data: { direction: 'up' | 'down' | 'stop' };
}

type ClientMessage = MoveMessage;

export class GameService {
  private ball: Ball;
  private playerPaddle: Paddle;
  private opponentPaddle: Paddle;
  private score: Score;
  private clients: Map<number, WebSocket> = new Map();
  private gameInterval: NodeJS.Timeout | null = null;
  private players: number[];

  constructor(players: number[]) {
    this.players = players;
    this.ball = new Ball();
    this.score = new Score();
    this.playerPaddle = new Paddle(50, true); // Left paddle
    this.opponentPaddle = new Paddle(750, false); // Right paddle
  }

  public addClient(playerId: number, socket: WebSocket): void {
    if (!this.players.includes(playerId)) {
      console.warn(`Player ${playerId} is not part of this game.`);
      return;
    }
    if (this.clients.has(playerId)) {
      console.warn(`Client with playerId ${playerId} is already connected.`);
      return;
    }
    this.clients.set(playerId, socket);
  }

  public removeClient(playerId: number): void {
    this.clients.delete(playerId);
    if (this.clients.size === 0) {
      this.stopGame();
    }
  }

  public startGame(): void {
    if (this.gameInterval) return;

    this.resetBall();

    this.gameInterval = setInterval(() => {
      this.updateGamePhysics(0.05); // 50 ms
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
    const data: ClientMessage = JSON.parse(message);
    switch (data.type) {
      case 'move':
        this.handlePlayerMove(playerId, data.data);
        break;
      default:
        console.warn(`Unknown message type: ${data.type}`);
    }
  }

  private handlePlayerMove(playerId: number, data: { direction: 'up' | 'down' | 'stop' }): void {
    const direction = data.direction;
    const paddle = playerId === 1 ? this.playerPaddle : this.opponentPaddle;

    if (direction === 'up') {
      paddle.move('up', canvasHeight);
    } else if (direction === 'down') {
      paddle.move('down', canvasHeight);
    }
  }

  public updatePlayerMove(playerId: number, direction: 'up' | 'down' | 'stop'): void {
    const paddle = playerId === 1 ? this.playerPaddle : this.opponentPaddle;

    switch (direction) {
      case 'up':
        paddle.move('up', canvasHeight);
        break;
      case 'down':
        paddle.move('down', canvasHeight);
        break;
      case 'stop':
        paddle.stop();
        break;
      default:
        console.warn(`Unknown direction: ${direction}`);
    }
  }

  private updateGamePhysics(deltaTime: number): void {
    this.ball.update(canvasWidth, canvasHeight, deltaTime);

    this.playerPaddle.update(canvasHeight, deltaTime);
    this.opponentPaddle.update(canvasHeight, deltaTime);
    this.checkCollisions();
    this.checkScore();
  }

  private checkCollisions(): void {
    const ballPos = this.ball.getPosition();
    const ballSize = this.ball.getSize();

    [this.playerPaddle, this.opponentPaddle].forEach((paddle) => {
      const paddlePos = paddle.getPosition();
      const paddleSize = paddle.getSize();

      if (
        ballPos.x + ballSize / 2 >= paddlePos.x &&
        ballPos.x - ballSize / 2 <= paddlePos.x + paddleSize.width &&
        ballPos.y + ballSize / 2 >= paddlePos.y &&
        ballPos.y - ballSize / 2 <= paddlePos.y + paddleSize.height
      ) {
        const relativeY = (ballPos.y - (paddlePos.y + paddleSize.height / 2)) / (paddleSize.height / 2);
        this.ball.reverseX();
        this.ball.setVelocityY(relativeY * this.ball.getCurrentSpeed());
      }
    });
  }

  private checkScore(): void {
    const ballPos = this.ball.getPosition();
    const ballSize = this.ball.getSize();

    if (ballPos.x - ballSize / 2 <= 0) {
      this.score.incrementOpponent();
      this.resetBall();
    } else if (ballPos.x + ballSize / 2 >= canvasWidth) {
      this.score.incrementPlayer();
      this.resetBall();
    }

    if (this.score.hasWinner()) {
      this.stopGame();
      const winner = this.score.getWinner();
      this.clients.forEach((client) =>
        client.send(JSON.stringify({ type: 'gameOver', winner }))
      );
    }
  }

  private resetBall(): void {
    this.ball.reset();
  }

  private broadcastGameState(): void {
    const state: GameState = {
      timestamp: Date.now(),
      ball: this.ball.getPosition(),
      playerPaddle: this.playerPaddle.getPosition(),
      computerPaddle: this.opponentPaddle.getPosition(),
      score: this.score.getScore(),
    };

    const stateString = JSON.stringify(state);
    this.clients.forEach((client, playerId) => {
      try {
        client.send(stateString);
      } catch (error) {
        console.error(`Failed to send state to player ${playerId}:`, error);
        this.removeClient(playerId);
      }
    });
  }

}
