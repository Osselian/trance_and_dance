import { PrismaClient, Match} from "@prisma/client";

export class MatchmakingRepository {
	constructor( private prisma = new PrismaClient()) {}

	async createMatchAndCleanup(player1Id: number, player2Id: number): Promise<Match> 
	{
		return this.prisma.$transaction(async (tx) => 
		{
			await tx.matchMakingRequest.deleteMany({
				where: { userId: { in: [player1Id, player2Id] } }
			});

			const match = await tx.match.create({
				data: { player1Id, player2Id }
			});
			return match;
		});
	}
}