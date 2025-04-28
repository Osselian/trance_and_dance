import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { TournamentMatchService } from "../../services/TournamentMatchService";

export class TournamentMatchController {
	private tmService = new TournamentMatchService();

	constructor(
		private fastify: FastifyInstance
	){}

	public registerSecureRoutes(): void {
		this.fastify.post('/:id/start', this.start.bind(this));
		this.fastify.post('/:tId/match/:mId/complete', this.complete.bind(this));
	}

	public registerRoutes(): void {
		this.fastify.get('/:id/bracket', this.bracket.bind(this));
	}

	private async start(req: FastifyRequest, reply: FastifyReply) {
		const tournamentId = Number((req.params as any).id);
		const { participants} = req.body as { participants: number[]};
		try { 
			const bracket = await this.tmService
				.generateBracket(tournamentId, participants);
			reply.status(201).send(bracket);
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Error';
			reply.status(400).send({ message: msg});
		}
	}

	private async bracket(req: FastifyRequest, reply: FastifyReply) {
		const tournamentId = Number((req.params as any).id);
		const bracket = await this.tmService.getBracket(tournamentId);
		reply.send(bracket);
	}

	private async complete(req: FastifyRequest, reply: FastifyReply) {
		const tournamentMatchId = Number((req.params as any).mId);
		const { result } = req.body as { result: string};
		try { 
			const updated = await this.tmService
				.completeMatch(tournamentMatchId, result);
			reply.send(updated);
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Error';
			reply.status(400).send({ message: msg});
		}
	}
}