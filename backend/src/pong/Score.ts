import { GameScore } from './types';
import { SCORE_TO_WIN } from './constants';

export class Score {
  private score: { player: number; opponent: number } = { player: 0, opponent: 0 }; // Initialize with default values

  constructor() {}

  public incrementPlayer(): void {
    this.score.player++;
  }

  public incrementOpponent(): void {
    this.score.opponent++;
  }

  public getScore(): { player: number; opponent: number } {
    return this.score;
  }

  public hasWinner(): boolean {
    return this.score.player >= SCORE_TO_WIN || this.score.opponent >= SCORE_TO_WIN;
  }

  public getWinner(): 'player' | 'computer' | null {
    if (this.score.player >= SCORE_TO_WIN) return 'player';
    if (this.score.opponent >= SCORE_TO_WIN) return 'computer';
    return null;
  }

  public getState(): GameScore {
    return { ...this.score };
  }
}