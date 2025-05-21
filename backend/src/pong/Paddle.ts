import { Position, Size } from './types';
import { PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_SPEED } from './constants';

export class Paddle {
  private position: Position;
  private size: Size = { width: PADDLE_WIDTH, height: PADDLE_HEIGHT };
  private speed: number = PADDLE_SPEED;
  private isMoving: boolean = false; // Add this property
  private moveDirection: 'up' | 'down' | null = null; // Add this property

  constructor(x: number, isPlayer: boolean) {
    this.position = { x, y: 300 }; // Start in the middle vertically
  }

  public getPosition(): Position {
    return { ...this.position };
  }

  public getSize(): Size {
    return { ...this.size };
  }

  public move(direction: 'up' | 'down', canvasHeight: number): void {
    if (direction === 'up') {
      this.position.y = Math.max(0, this.position.y - this.speed);
    } else if (direction === 'down') {
      this.position.y = Math.min(canvasHeight - this.size.height, this.position.y + this.speed);
    }
  }

  public update(canvasHeight: number, deltaTime: number): void {
    if (this.isMoving) {
      const direction = this.moveDirection === 'up' ? -1 : 1;
      this.position.y = Math.max(0, Math.min(canvasHeight - this.size.height, this.position.y + direction * this.speed * deltaTime));
    }
  }

  public startMoving(direction: 'up' | 'down'): void {
    this.isMoving = true;
    this.moveDirection = direction;
  }

  public stopMoving(): void {
    this.isMoving = false;
    this.moveDirection = null;
  }
}
