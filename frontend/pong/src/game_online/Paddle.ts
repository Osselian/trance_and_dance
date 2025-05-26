import { Position, Size } from '../utils/types';
import { PADDLE_HEIGHT, PADDLE_WIDTH, COLORS } from '../utils/constants';

export class Paddle {
  private position: Position;
  private size: Size;
  // private currentSpeed: number;
  private isPlayer: boolean;
  private isMoving: boolean;
  private moveDirection: 'up' | 'down' | null;

  constructor(x: number, isPlayer: boolean) {
    this.position = { x, y: 250 }; // Start in the middle vertically
    this.size = { width: PADDLE_WIDTH, height: PADDLE_HEIGHT };
    // this.currentSpeed = 0;
    this.isPlayer = isPlayer;
    this.isMoving = false;
    this.moveDirection = null;
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.isPlayer ? '#00FF00' : '#F08080'; // Green for player, Red for opponent
    ctx.fillRect(
      this.position.x,
      Math.round(this.position.y),
      this.size.width,
      this.size.height
    );
  }

  public move(direction: 'up' | 'down', canvasHeight: number): void {
    this.isMoving = true;
    this.moveDirection = direction;
  }

  public stop(): void {
    this.isMoving = false;
    this.moveDirection = null;
  }


  public getPosition(): Position {
    return { ...this.position };
  }

  public getSize(): Size {
    return { ...this.size };
  }

  public isPlayerPaddle(): boolean {
    return this.isPlayer;
  }

  public reset(canvasHeight: number): void {
    this.position.y = (canvasHeight - this.size.height) / 2;
    // this.currentSpeed = 0;
    this.isMoving = false;
    this.moveDirection = null;
  }

  public setPosition(y: number): void {
    this.position.y = y;
  }

  public setCenterY(y: number, canvasHeight: number): void {
    const size = this.getSize();
    this.position.y = Math.max(0, Math.min(canvasHeight - size.height, y - size.height / 2));
  }
}