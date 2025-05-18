export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Velocity {
  x: number;
  y: number;
}

export enum GameState {
  MODE_SELECTION = 'modeSelection',
  START = 'start',
  PLAYING = 'playing',
  PAUSED = 'paused',
  GAME_OVER = 'gameOver'
}

export enum GameMode {
  VS_COMPUTER = 'vsComputer',
  VS_PLAYER = 'vsPlayer'
}

export interface GameScore {
  player: number;
  computer: number;
} 