import { GameScore } from '../utils/types';
import { SCORE_TO_WIN } from '../utils/constants';

export class Score {
  private score: GameScore;
  private scoreDisplay: HTMLElement;

  constructor() {
    this.score = { player: 0, computer: 0 };
    this.scoreDisplay = document.getElementById('scoreDisplay') as HTMLElement;
    this.updateDisplay();
  }

  public incrementPlayer(): void {
    this.score.player++;
    this.updateDisplay();
  }

  public incrementComputer(): void {
    this.score.computer++;
    this.updateDisplay();
  }

  public reset(): void {
    this.score = { player: 0, computer: 0 };
    this.updateDisplay();
  }

  public getScore(): GameScore {
    return { ...this.score };
  }

  public hasWinner(): boolean {
    return this.score.player >= SCORE_TO_WIN || this.score.computer >= SCORE_TO_WIN;
  }

  public getWinner(): 'player' | 'computer' | null {
    if (this.score.player >= SCORE_TO_WIN) return 'player';
    if (this.score.computer >= SCORE_TO_WIN) return 'computer';
    return null;
  }

  private updateDisplay(): void {
    this.scoreDisplay.textContent = `${this.score.player} - ${this.score.computer}`;
  }
} 