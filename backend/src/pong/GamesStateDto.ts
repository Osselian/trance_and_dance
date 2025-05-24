import { GameScore, Position } from "./types";

export interface GamesStateDto {
	ballPos: Position;
	player1PaddlePos: Position;
	player2PaddlePos: Position;
	score: GameScore;
	gameState: string;
	isWaitingForBallSpawn: boolean;
	lastScoreTime: number;
	hasWinner: boolean;
	winnerId: number | null;
}