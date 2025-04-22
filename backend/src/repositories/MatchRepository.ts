import { PrismaClient, Match, MatchStatus } from "@prisma/client";

const prisma = new PrismaClient();

export class MatchRepository{
	async createMatch(player1Id: number, player2Id: number): Promise<Match>{
		 return prisma.match.create({data: { player1Id: player1Id, player2Id: player2Id}});
	}

	async updateStatus(matchId: number,  newStatus: MatchStatus): Promise<Match> {
		return prisma.match.update({
			where: {id: matchId},
			data: {status: newStatus}
		});
	}

	async findById(matchId: number): Promise<Match | null> {
		return prisma.match.findUnique({
			where: {id: matchId}
		});
	}

	async completeMatch(matchId: number, result: string): Promise<Match> {
		return prisma.match.update({
			where: {id: matchId},
			data: {
				status: MatchStatus.COMPLETED, 
				playedAt: new Date(),  
				result: result}
		});
	}

	async  findByStatus(status: MatchStatus): Promise<Match[]> {
		return prisma.match.findMany({
			where: {status: status}
		});
	}

	async findByPlayer(userId: number): Promise<Match[]> {
		return prisma.match.findMany({
			where: {
				OR: [{player1Id: userId}, {player2Id: userId}]
			},
			orderBy: {startAt: 'desc'}
		});
	}

	async findByPlayerAndStatus(userId: number, status: MatchStatus): Promise<Match[]> {
		return prisma.match.findMany({
			where: {
				status: status,
				OR: [{player1Id: userId}, {player2Id: userId}]
			},
			orderBy: {startAt: 'desc'}
		});
	}
}