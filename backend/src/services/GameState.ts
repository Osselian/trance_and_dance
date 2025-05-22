export interface GameState {
  timestamp: number;
  ball: { x: number; y: number };
  playerPaddle: { x: number; y: number };
  computerPaddle: { x: number; y: number };
  score: { player: number; computer: number };
}