import { PrismaClient, TournamentMatch, MatchStatus } from "@prisma/client";
import { TournamentMatchDto } from "../dtos/TournamentMatchDto";

const prisma = new PrismaClient();

export class TournamentMatchRepository {
	async create(data: TournamentMatchDto): Promise<TournamentMatch> {
		return prisma.tournamentMatch.create({ data});
	}

	async findById( id: number): Promise<TournamentMatch | null> {
		return prisma.tournamentMatch.findUnique({ where: { id}});
	}

	async findAllByTournament(tournamentId: number): Promise<TournamentMatch[]> 
	{
		return prisma.tournamentMatch.findMany({ 
			where: { tournamentId},
			orderBy: { bracketPos: 'asc'},
			include: { match: true}
		});
	}

	async findByTournamentAndRound(tournamentId: number, round: number): 
		Promise<TournamentMatch[]> 
	{
		return prisma.tournamentMatch.findMany({ 
			where: { tournamentId, round},
			orderBy: { bracketPos: 'asc'},
			include: { match: true}
		});
	}

	async updateStatus(id: number, status: MatchStatus): Promise<TournamentMatch> {
		return prisma.$transaction(async ts => {
			await ts.match.update({
				where: { id: (await ts.tournamentMatch.findUnique({
					where: {id}
				}))?.matchId},
				data: {status}
			});
			return ts.tournamentMatch.update({ where: { id}, data: {}});
		});		
	}

	async delete(id: number): Promise<TournamentMatch> {
		return prisma.tournamentMatch.delete({ where: { id}});
	}
}