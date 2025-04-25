import { TournamentMatchRepository } from "../repositories/TournamentMatchRepository"; 
import { MatchRepository } from "../repositories/MatchRepository";
import { TournamentMatch, MatchStatus } from "@prisma/client";

export class TournamentMatchService {
	constructor(
		private tmRepo = new TournamentMatchRepository(),
		private matchRepo = new MatchRepository()
	) {}

	async generateBracket(tournamentId: number, participantIds: number[]): 
		Promise<TournamentMatch[]> 
	{
		const matches = await Promise.all(
			participantIds.reduce(
				(acc, userId, idx, arr) => {
					if (idx % 2 === 1) {
						const p1 = arr[idx - 1];
						const p2 = arr[idx];
						acc.push(this.matchRepo.createMatch(p1, p2));
					}
					return acc;
				}, [] as Promise<any>[]
			)
		);

		//проверить эти касты
		const tmEntries = await Promise.all(
			matches.map(async (m, idx) => {
				return this.tmRepo.create({
					tournamentId,
					matchId: m.id,
					round: 1,
					bracketPos: idx + 1
				});
			})
		);

		return tmEntries;
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

		await this.matchRepo.completeMatch(tm.matchId, result);
		//проверить эти касты
		const updatedTm = await this.tmRepo.findById(tournamentMatchId);
		if (!updatedTm)
			throw new Error('Tournament match not found after complete!');
		return updatedTm;
	}
}