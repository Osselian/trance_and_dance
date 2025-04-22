import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { MatchRepository } from '../../repositories/MatchRepository'

export class MatchController {
	private matchRepo = new MatchRepository();

	constructor(private fastify: FastifyInstance) {}

	public registerRoutes(): void {
		this.fastify.get('/:id', this.getMatch.bind(this));
		this.fastify.post('/:id/complete', this.completeMatch.bind(this));
	}


	private async getMatch(req: FastifyRequest, reply:FastifyReply) {
		const matchId = Number((req.params as any).id);
		const match = await this.matchRepo.findById(matchId);
		if (!match)
			return reply.status(404).send({ message: 'Match not found'});
		reply.send(match);
	}

	private async completeMatch(req: FastifyRequest, reply: FastifyReply) {
		const matchId = Number((req.params as any).id);
		const { result} =  req.body as { result: string};
		try {
			const match = await this.matchRepo.completeMatch(matchId, result);
			reply.send(match);
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Error';
			reply.status(400).send({ message: msg});
		}
	}
}