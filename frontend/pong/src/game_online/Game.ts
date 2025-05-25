import { GameState, GameMode } from '../utils/types';
import { Paddle } from './Paddle';
import { Ball } from './Ball';
import { Score } from './Score';
import { GamesStateDto } from '../utils/types';


export class Game {
  private ws: WebSocket;
  private settings: any;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private playerPaddle: Paddle;
  private computerPaddle: Paddle;
  private ball: Ball;
  private score: Score;
  private gameState: GameState;
  private gameMode: GameMode | null = null;
  private gameMessage: HTMLElement;
  private animationFrameId: number | null = null;
  private lastScoreTime: number = 0;
  private readonly SCORE_DELAY = 1000; // 1 second delay
  private isWaitingForBallSpawn: boolean = false;
  private isGameStartCountdown: boolean = false;
  private lastFrameTime: number = 0;
  private targetPaddlePositions: { player: number; computer: number } | null = null;

  constructor(mode: GameMode, ws: WebSocket, settings: any) {
    this.ws = ws;
    this.settings = settings;
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
    this.gameMessage = document.getElementById('gameMessage') as HTMLElement;
    this.lastFrameTime = performance.now();

    // Set canvas size
    this.canvas.width = 800;
    this.canvas.height = 600;

    // Initialize game objects
    this.playerPaddle = new Paddle(50, true);
    this.computerPaddle = new Paddle(this.canvas.width - 60, false);
    this.ball = new Ball();
    this.score = new Score();
    this.gameMode = mode ?? null;
    this.gameState = mode != null
      ? GameState.START
      : GameState.MODE_SELECTION;

    // Set up event listeners
    this.setupEventListeners();
  }

  public start(): void {
    this.hideMessage(); // Hide the message element since we're drawing on canvas
    this.gameLoop();
  }

  private update(deltaTime: number): void {
    if (this.gameState !== GameState.PLAYING) return;

    this.updatePaddlePositions(deltaTime);
    this.playerPaddle.update(this.canvas.height, deltaTime);
    this.ball.update(this.canvas.width, this.canvas.height, deltaTime);

    if (this.gameMode === GameMode.VS_COMPUTER) {
      this.updateComputerPaddle(deltaTime);
    } else {
      this.computerPaddle.update(this.canvas.height, deltaTime);
    }

    this.checkCollisions();
    this.checkScoring();
  }

  private draw(): void {
    // Clear canvas
    this.ctx.fillStyle = '#1A1A1A';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw center line
    this.ctx.setLineDash([10, 10]);
    this.ctx.beginPath();
    this.ctx.moveTo(this.canvas.width / 2, 0);
    this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    // Draw game objects
    this.playerPaddle.draw(this.ctx);
    this.computerPaddle.draw(this.ctx);

    // Only draw ball if not in countdown
    if (!this.isGameStartCountdown && !this.isWaitingForBallSpawn) {
      this.ball.draw(this.ctx);
    }

    // Draw countdown if waiting for ball spawn or game start countdown
    if ((this.isWaitingForBallSpawn || this.isGameStartCountdown) && !this.score.hasWinner()) {
      const currentTime = performance.now();
      const timeElapsed = currentTime - this.lastScoreTime;

      this.ctx.font = '120px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';

      // Show countdown numbers and GO! with different colors
      if (timeElapsed < 250) {
        this.ctx.fillStyle = '#FF0000'; // Red
        this.ctx.fillText('3', this.canvas.width / 2, this.canvas.height / 2);
      } else if (timeElapsed < 500) {
        this.ctx.fillStyle = '#FFA500'; // Orange
        this.ctx.fillText('2', this.canvas.width / 2, this.canvas.height / 2);
      } else if (timeElapsed < 750) {
        this.ctx.fillStyle = '#FFFF00'; // Yellow
        this.ctx.fillText('1', this.canvas.width / 2, this.canvas.height / 2);
      } else if (timeElapsed < 1000) {
        this.ctx.fillStyle = '#00FF00'; // Green
        this.ctx.fillText('GO!', this.canvas.width / 2, this.canvas.height / 2);
      } else if (this.isGameStartCountdown) {
        this.isGameStartCountdown = false;
        this.resetBall();
        this.ball.show();
      }
    }

    // Draw all game messages on canvas
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    if (this.gameState === GameState.MODE_SELECTION) {
      this.ctx.font = '40px Arial';
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fillText('Choose game mode:', this.canvas.width / 2, this.canvas.height / 2 - 50);
      this.ctx.font = '30px Arial';
      // this.ctx.fillText('Press 1 to play against computer', this.canvas.width / 2, this.canvas.height / 2 + 20);
      // this.ctx.fillText('Press 2 to play with a human player', this.canvas.width / 2, this.canvas.height / 2 + 60);
    } else if (this.gameState === GameState.START) {
      this.ctx.font = '30px Arial';
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fillText('Press SPACE to start', this.canvas.width / 2, this.canvas.height / 2);
    } else if (this.gameState === GameState.PAUSED) {
      this.ctx.font = '30px Arial';
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fillText('PAUSED - Press SPACE to continue', this.canvas.width / 2, this.canvas.height / 2);
    } else if (this.gameState === GameState.GAME_OVER) {
      this.ctx.font = '30px Arial';
      this.ctx.fillStyle = '#FFFFFF';
      const winner = this.score.getWinner();
      this.ctx.fillText(`${winner === 'player' ? 'You' : 'Computer'} won! Press SPACE to play again`,
        this.canvas.width / 2, this.canvas.height / 2);
    }
  }

}