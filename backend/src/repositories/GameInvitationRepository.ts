import { PrismaClient, InviteStatus } from "@prisma/client";

const prisma = new PrismaClient();

export class GameInvitationRepository {

	async createInvite(fromId: number, toId: number, game: string) {
		const expiresAt: Date = new Date() ; // прибавить 5 минут
		return prisma.gameInvitation.create({
			data: { fromId, toId, game, expiresAt}
		});
	}

	async findIncoming(toId: number, cursor?: number) {
		return prisma.gameInvitation.findMany({
			where: { toId, status: InviteStatus.PENDING},
			...(cursor && { cursor: { id: cursor}, skip: 1}) // проверить на корректность
		});
	}

	async findOutgoing(fromId: number) {
		return prisma.gameInvitation.findMany({
			where: { fromId, status: InviteStatus.PENDING}
		});
	}

	async updateStatus(id: number, status: InviteStatus) {
		return prisma.gameInvitation.update({
			where: { id },
			data: { status, respondedAt: new Date()}
		});
	}

	async existsPending(fromId: number, toId: number, game: string): 
		Promise<boolean> 
	{
		const count = await prisma.gameInvitation.count({
			where: { fromId, toId, game, status: InviteStatus.PENDING}
		});
		return count > 0;
	}

	async findById(id: number) {
		return prisma.gameInvitation.findUnique({ where: { id }});
	}
}