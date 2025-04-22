import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { MatchmakingService } from "../../services/MatchmakingService";
import { Match, MatchStatus} from '@prisma/client'

export class MatchmakingController {
	constructor(
		private fastify: FastifyInstance,
		private mmService = new MatchmakingService()
	) {}

	public registerProtectedRoutes(): void {
		this.fastify.post('/join', this.joinQueue.bind(this));
		this.fastify.post('/leave', this.leaveQueue.bind(this));
		this.fastify.get('/checkPending', this.checkForPendingMatch.bind(this))
	}

	public registerPublicRoutes(): void {
		this.fastify.post('/process', this.processQueue.bind(this));
	}

	private async joinQueue(req: FastifyRequest, reply: FastifyReply) {
		const { id: userId} = req.user as any;
		try {
			await this.mmService.joinQueue(userId);
			reply.send({ message: 'Joined matchmaking queue'});
		}
		catch (err) {
			const msg = err instanceof Error ? err.message : 'Error';
			reply.status(400).send({ message: msg});
		}
	}

	private async leaveQueue(req: FastifyRequest, reply: FastifyReply) {
		const { id: userId} = req.user as any;
		try {
			await this.mmService.leaveQueue(userId);
			reply.send({ message: 'Left matchmaking queue'});
		}
		catch (err) {
			const msg = err instanceof Error ? err.message : 'Error';
			reply.status(400).send({ message: msg});
		}
	}

	private async processQueue(req: FastifyRequest, reply: FastifyReply){
		try {
			const matches: Match[] = await this.mmService.processQueue();
			reply.send({ created: matches.length, matches});
		}
		catch (err) {
			const msg = err instanceof Error ? err.message : 'Error';
			reply.status(500).send({ message: msg});
		}
	}

	private async checkForPendingMatch(req: FastifyRequest, reply: FastifyReply) {
		const user = req.user as any
		try {
			const match = await this.mmService.findMatchForPlayer(user.id);
			if (!match)
				reply.send({found: false});
			else
				reply.send({found: true, matchId: match.id});
		}
		catch (err) {
			const msg = err instanceof Error ? err.message : 'Error';
			reply.status(500).send({ message: msg});
		}
	}
}