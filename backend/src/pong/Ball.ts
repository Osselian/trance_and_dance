import { Position, Velocity } from './types';
import { BALL_SIZE, INITIAL_BALL_SPEED, BALL_SPEED_INCREMENT, MAX_BALL_SPEED, canvasWidth, canvasHeight, deltaTime } from './constants';

export class Ball {
  private position: Position = { x: 400, y: 300 };
  private velocity: Velocity = { x: 0, y: 0 };
  private size: number = BALL_SIZE;
  private currentSpeed: number = INITIAL_BALL_SPEED;

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.position = { x: 400, y: 300 }; // Center of the screen
    this.currentSpeed = INITIAL_BALL_SPEED;
    const direction = Math.random() > 0.5 ? 1 : -1;
    const angle = (Math.random() - 0.5) * Math.PI / 2;
    this.velocity = {
      x: direction * this.currentSpeed * Math.cos(angle),
      y: this.currentSpeed * Math.sin(angle),
    };
  }

  public update(canvasWidth: number, canvasHeight: number, deltaTime: number): void {
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;

    // Bounce off top and bottom walls
    if (this.position.y <= this.size / 2 || this.position.y >= canvasHeight - this.size / 2) {
      this.velocity.y = -this.velocity.y;
    }
  }

  public getPosition(): Position {
    return { ...this.position };
  }

  public reverseX(): void {
    this.velocity.x = -this.velocity.x;
    this.currentSpeed = Math.min(MAX_BALL_SPEED, this.currentSpeed + BALL_SPEED_INCREMENT);
    const magnitude = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
    if (magnitude > 0) {
      this.velocity.x = (this.velocity.x / magnitude) * this.currentSpeed;
      this.velocity.y = (this.velocity.y / magnitude) * this.currentSpeed;
    }
  }

  public setVelocityY(newVelocityY: number): void {
    this.velocity.y = newVelocityY;
  }

  public getState(): BallState {
    return {
      position: this.position,
      velocity: this.velocity,
      size: this.size,
    };
  }

  public getSize(): number {
    return this.size;
  }

  public getCurrentSpeed(): number {
    return this.currentSpeed;
  }
}

interface BallState {
  position: Position;
  velocity: Velocity;
  size: number;
}


