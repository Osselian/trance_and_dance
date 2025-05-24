interface Position {
  x: number;
  y: number;
}

export interface GamesStateDto {
	ballPos: Position;
	player1PaddlePos: Position;
	player2PaddlePos: Position;
	score: { player: number; opponent: number;};
	gameState: string;
	isWaitingForBallSpawn: boolean;
	lastScoreTime: number;
	hasWinner: boolean;
	winnerId: number | null;
}