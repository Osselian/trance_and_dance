import { GameScore } from './types';
import { SCORE_TO_WIN } from './constants';
import { Ball } from './Ball';
import { Paddle } from './Paddle';

export class Score {
  private playerScore: number;
  private opponentScore: number;

  constructor() {
    this.playerScore = 0;
    this.opponentScore = 0;
  }

  public incrementPlayer(): void {
    this.playerScore++;
  }

  public incrementOpponent(): void {
    this.opponentScore++;
  }

  public getScore(): { player: number; computer: number } {
    return {
      player: this.playerScore,
      computer: this.opponentScore,
    };
  }

  public hasWinner(): boolean {
    return this.playerScore >= SCORE_TO_WIN || this.opponentScore >= SCORE_TO_WIN;
  }

  public getWinner(): 'player' | 'computer' | null {
    if (this.playerScore >= SCORE_TO_WIN) return 'player';
    if (this.opponentScore >= SCORE_TO_WIN) return 'computer';
    return null;
  }

  public getState(): GameScore {
    return { player: this.playerScore, opponent: this.opponentScore };
  }
}

export class Game {
  private ball: Ball;
  private score: Score;
  private playerPaddle: Paddle;
  private opponentPaddle: Paddle;

  constructor() {
    this.ball = new Ball();
    this.score = new Score(); // Убедитесь, что объект Score создается
    this.playerPaddle = new Paddle(50, true); // Left paddle
    this.opponentPaddle = new Paddle(750, false); // Right paddle
  }
}