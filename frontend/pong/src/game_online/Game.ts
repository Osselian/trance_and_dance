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
  private leftPaddle: Paddle;
  private rightPaddle: Paddle;
  private ball: Ball;
  private score: Score;
  private gameState: GameState;
  private gameMode: GameMode | null = null;
  private gameMessage: HTMLElement;
  private animationFrameId: number | null = null;
  private lastScoreTime: number = 0;
  private readonly SCORE_DELAY = 1000; // 1 second delay
  private isWaitingForBallSpawn: number = -1;
  private isGameStartCountdown: boolean = false;
  private lastFrameTime: number = 0;
  private targetPaddlePositions: { player: number; computer: number } | null = null;

  constructor(mode: GameMode, ws: WebSocket, settings: any) {
    this.ws = ws;
    this.settings = settings; // settings come from server in a 'connection' message
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
    this.gameMessage = document.getElementById('gameMessage') as HTMLElement;
    this.lastFrameTime = performance.now();

    // Set canvas size
    this.canvas.width = 800;
    this.canvas.height = 600;

    // Initialize game objects
    this.leftPaddle = new Paddle(50, false);
    this.rightPaddle = new Paddle(this.canvas.width - 60, false);
    this.ball = new Ball();
    this.score = new Score();
    this.gameMode = mode ?? null;
    this.gameState = mode != null
      ? GameState.START
      : GameState.MODE_SELECTION;

  }

  public start(): void {
    // Set up WebSocket message handler
    console.log('Connected to game server');
    // Set the correct paddle as player's paddle based on playerNumber
    if (this.settings.playerNumber === 1) {
      this.leftPaddle = new Paddle(50, true);
      this.rightPaddle = new Paddle(this.canvas.width - 60, false);
    } else {
      this.leftPaddle = new Paddle(50, false);
      this.rightPaddle = new Paddle(this.canvas.width - 60, true);
    }

    this.subscribeOnWsEvents();


    // Set up keyboard input handler
    document.addEventListener('keydown', (event) => {
      if (this.gameState !== GameState.PLAYING) return;

      let direction: 'up' | 'down' | null = null;

      switch (event.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          direction = 'up';
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          direction = 'down';
          break;
      }

      if (direction) {
        this.ws.send(JSON.stringify({
          type: 'move',
          direction: direction
        }));
      }
    });

      this.ws.send(JSON.stringify({ type: 'ready' }));
    // Start the game loop
    // const gameLoop = (timestamp: number) => {
    //   const deltaTime = timestamp - this.lastFrameTime;
    //   this.lastFrameTime = timestamp;

    //   this.update(deltaTime);
    //   this.draw();

    //   this.animationFrameId = requestAnimationFrame(gameLoop);
    // };

    // this.animationFrameId = requestAnimationFrame(gameLoop);
  }

  private subscribeOnWsEvents(){
    this.ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'connection':
          break;
          
        case 'playerConnected':
          console.log('Opponent connected');
          break;
          
        case 'ping':
          // send back pong
          // this.ws.send(JSON.stringify({ type: 'pong' }));//может тоже убрать
          break;
          
        case 'error':
          console.error('Server error:', message.message);
          break;
          
        case 'playerDisconnected':
          console.log('Opponent disconnected:', message.message);
          break;
          
        case 'readyStatus':
          console.log('A player is ready to join the game');
          break;        
        case 'gameStart':
          this.gameState = GameState.PLAYING;
          this.isGameStartCountdown = true;
          this.lastScoreTime = performance.now();
          break;          
        case 'gameStop':
          this.gameState = GameState.GAME_OVER;
          break;          
        case 'gameState':
          // Update game state with received data
          if (message.ballPos) {
            this.ball.setPosition(message.ballPos.x, message.ballPos.y);
          }
          if (message.player1PaddlePos) {
            this.leftPaddle.setPosition(message.player1PaddlePos.y);
          }
          if (message.player2PaddlePos) {
            this.rightPaddle.setPosition(message.player2PaddlePos.y);
          }
          if (message.score) {
            this.score.setScore(message.score.player1, message.score.player2);
          }
          this.isWaitingForBallSpawn = message.isWaitingForBallSpawn;
          this.lastScoreTime = message.lastScoreTime;
          break;
      }
      
      // Redraw the game state after processing the message
      this.draw();
    });
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
    this.leftPaddle.draw(this.ctx);
    this.rightPaddle.draw(this.ctx);

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
      // if (timeElapsed < 250) {
      //   this.ctx.fillStyle = '#FF0000'; // Red
      //   this.ctx.fillText('3', this.canvas.width / 2, this.canvas.height / 2);
      // } else if (timeElapsed < 500) {
      //   this.ctx.fillStyle = '#FFA500'; // Orange
      //   this.ctx.fillText('2', this.canvas.width / 2, this.canvas.height / 2);
      // } else if (timeElapsed < 750) {
      //   this.ctx.fillStyle = '#FFFF00'; // Yellow
      //   this.ctx.fillText('1', this.canvas.width / 2, this.canvas.height / 2);
      // } else if (timeElapsed < 1000) {
      //   this.ctx.fillStyle = '#00FF00'; // Green
      //   this.ctx.fillText('GO!', this.canvas.width / 2, this.canvas.height / 2);
      // } else if (this.isGameStartCountdown) {
      //   this.isGameStartCountdown = false;
      //   this.ball.show();
      // }
      switch (this.isWaitingForBallSpawn) {
        case 4:
          this.ctx.fillStyle = '#FF0000'; // Red
          this.ctx.fillText('3', this.canvas.width / 2, this.canvas.height / 2);
          break;
        case 3:
          this.ctx.fillStyle = '#FFA500'; // Orange
          this.ctx.fillText('2', this.canvas.width / 2, this.canvas.height / 2);
          break;
        case 2:
          this.ctx.fillStyle = '#FFFF00'; // Yellow
          this.ctx.fillText('1', this.canvas.width / 2, this.canvas.height / 2);
          break;
        case 1:
          this.ctx.fillStyle = '#00FF00'; // Green
          this.ctx.fillText('GO!', this.canvas.width / 2, this.canvas.height / 2);
          break;
        case 0:
          this.isGameStartCountdown = false;
          this.ball.show();
          break;
        default:
          break;
      }
    }

    // Draw all game messages on canvas
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    if (this.gameState === GameState.START) {
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