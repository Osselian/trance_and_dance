import { Position, Size } from './types';
import { PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_SPEED } from './constants';

export class Paddle {
  private position: { x: number; y: number };
  private velocity: number;

  constructor(initialX: number, isPlayer: boolean) {
    this.position = { x: initialX, y: 0 };
    this.velocity = 0; // Начальная скорость
  }

  public move(direction: 'up' | 'down', canvasHeight: number): void {
    const speed = 5; // Скорость движения
    if (direction === 'up') {
      this.velocity = -speed;
    } else if (direction === 'down') {
      this.velocity = speed;
    }
  }

  public stop(): void {
    this.velocity = 0; // Останавливаем движение
  }

  public update(canvasHeight: number, deltaTime: number): void {
    this.position.y += this.velocity * deltaTime;

    // Ограничиваем движение в пределах игрового поля
    if (this.position.y < 0) {
      this.position.y = 0;
    } else if (this.position.y > canvasHeight - this.getSize().height) {
      this.position.y = canvasHeight - this.getSize().height;
    }
  }

  public getPosition(): { x: number; y: number } {
    return this.position;
  }

  public getSize(): { width: number; height: number } {
    return { width: 10, height: 100 }; // Размер ракетки
  }
}
