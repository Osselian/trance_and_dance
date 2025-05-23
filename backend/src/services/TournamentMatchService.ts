import { TournamentMatchRepository } from "../repositories/TournamentMatchRepository"; 
import { TournamentRepository } from "../repositories/TournamentRepository";
import { MatchRepository } from "../repositories/MatchRepository";
import { TournamentMatch, Match, MatchStatus, TournamentStatus} from "@prisma/client";
import { TournamentBracketService } from "./TournamentBracketService";

export class TournamentMatchService {
	constructor(
		private tmRepo = new TournamentMatchRepository(),
		private matchRepo = new MatchRepository(),
		private tournamentRepo = new TournamentRepository(),
		private bracketService = new TournamentBracketService()
	) {}

	async generateBracket(tournamentId: number, participantIds: number[]): 
		Promise<TournamentMatch[]> 
	{
		const tournament = await this.tournamentRepo.findById(tournamentId);
		if (!tournament)
			throw new Error('Tournament not found');

		if (participantIds.length !== tournament.requiredPlayers)
			throw new Error(
				'Tournament requires exactly ' + tournament.requiredPlayers + ' players');
		
		await this.tournamentRepo.updateStatus(tournamentId, TournamentStatus.ONGOING);

		const roundOneMatches = 
			await this.bracketService.createFirstRoundMatches(tournamentId, participantIds);
		
		const totalRounds = Math.log2(tournament.requiredPlayers);
		let allMatches = [...roundOneMatches];

		for (let round = 2; round <= totalRounds; round++) {
			const matchesInRound = tournament.requiredPlayers / Math.pow(2, round);
			const roundMatches = await this.bracketService
				.createEmptyRoundMatches(tournamentId, round, matchesInRound);
			allMatches = [...allMatches, ...roundMatches];
		}

		await this.bracketService
			.connectMatchesInBracket(tournamentId, tournament.requiredPlayers);

		return allMatches;
	}

	async getBracket(tournamentId: number): Promise<TournamentMatch[]> {
		return this.tmRepo.findAllByTournament(tournamentId);
	}

	async completeMatch(tournamentMatchId: number, result: string): 
		Promise<TournamentMatch> 
	{
		const tm = await this.tmRepo.findById(tournamentMatchId);
		if (!tm)
			throw new Error('Tournament match not found');

		const updatedMatch = await this.matchRepo.completeMatch(tm.matchId, result);

		const winnerId = this.determineWinner(updatedMatch);
		if (!winnerId)
			throw new Error('Could not determine winner');

		await this.advanceWinnerToNextRound(tm.id, winnerId);

		const updatedTm = await this.tmRepo.findById(tournamentMatchId);
		if (!updatedTm)
			throw new Error('Tournament match not found after update');

		return updatedTm;
	}

	async awardTechnicalWin(tournamentMatchId: number, winnerId: number): 
		Promise<TournamentMatch>
	{
		const tm = await this.tmRepo.findById(tournamentMatchId);
		if (!tm)
			throw new Error('Tournament match not found');

		const match = await this.matchRepo.findById(tm.matchId);
		if (!match)
			throw new Error('Match not found');

		const isPlayer1 = match.player1Id === winnerId;
		const result = isPlayer1 ? '1:0' : '0:1';

		await this.matchRepo.completeMatch(tm.matchId, result);

		await this.tmRepo.updateWinner(tm.id, winnerId);

		await this.advanceWinnerToNextRound(tm.id, winnerId);

		const updatedTm = await this.tmRepo.findById(tournamentMatchId);
		if (!updatedTm)
			throw new Error('Tournament match not found after update');

		return updatedTm;

	}

	private determineWinner(match: Match): number | null {
		if (!match.result) return null;

		const [score1, score2] = match.result.split('-').map(Number);

		if (score1 > score2) {
			return match.player1Id;
		} else if (score2 > score1) {
			return match.player2Id;
		} else {
			return null; // Draw
		}
	}

	async advanceWinnerToNextRound(tournamentMatchId: number, winnerId: number):
		Promise<void>
	{
		const tm = await this.tmRepo.findById(tournamentMatchId);
		if (!tm)
			throw new Error('Tournament match not found');

		if (!tm.nextMatchId){
			const tournamentMatches = await this.tmRepo
				.findByTournamentAndRound(tm.tournamentId, tm.round);
			if (tournamentMatches.length === 1) {
				await this.tournamentRepo.updateWinner(tm.tournamentId, winnerId);
			}
			return;
		}

		const nextMatch = await this.tmRepo.findById(tm.nextMatchId);
		if (!nextMatch)
			throw new Error('Next match not found');

		const isPlayer1InNextMatch = tm.bracketPos % 2 === 1;

		if (isPlayer1InNextMatch) {
			await this.matchRepo.updatePlayer1(nextMatch.id, winnerId);
		}
		else {
			await this.matchRepo.updatePlayer2(nextMatch.id, winnerId);
		}

		const updatedNextMatch = await this.matchRepo.findById(nextMatch.id);
		if (updatedNextMatch &&
			updatedNextMatch.player1Id > 0 &&
			updatedNextMatch.player2Id > 0) 
		{
			await this.matchRepo.updateStatus(nextMatch.matchId, MatchStatus.PENDING);
			
			const tournament = await this.tournamentRepo.findById(tm.tournamentId);
			if (tournament && tournament.currentRound < nextMatch.round) 
				await this.tournamentRepo
					.updateCurrentRound(tm.tournamentId, nextMatch.round);
		}
	}

	// async checkInactiveParticipants(tournamentId: number): Promise<void>{
	// 	const pendingMatches = 
	// 		await this.tmRepo.findUnfinishedMatchesByTournament(tournamentId);

	// 	for (const tm of pendingMatches) {
	// 		const match = await this.matchRepo.findById(tm.matchId);
	// 		if
	// 		const player1Active = await this.isPlayerActive(match.player1Id);
	// 	}
	// }

	async checkAndStartNextRoundMatches(tournamentId: number): Promise<Match[]> {
		const tournament = await this.tournamentRepo.findById(tournamentId);
		if (!tournament)
			throw new Error('Tournament not found');

		const currentRound = tournament.currentRound;

		const pendingMatches = 
			await this.tmRepo.findPendingMatchesByRound(tournamentId, currentRound);
		const startedMatches: Match[] = [];
		
		for (const tm of pendingMatches) {
			const match = await this.matchRepo.findById(tm.matchId);
			if (!match)
				throw new Error('Match not found');
			if (match.player1Id > 0 && match.player2Id > 0) {
				const updatedMatch = await this.matchRepo.updateStatus(tm.matchId, MatchStatus.PENDING);
				startedMatches.push(updatedMatch);
			}
		}
		return startedMatches;
	}
}