import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { TournamentParticipantService } from "../../services/TournamentParticipantService";

export class TournamentParticipantController {
	private participantService = new TournamentParticipantService();

	constructor(
		private fastify: FastifyInstance
	){}

	public registerSecureRoutes(): void {
		this.fastify.post('/:id/register', this.register.bind(this));
		this.fastify.post('/:id/unregister', this.unregister.bind(this));
	}

	public registerRoutes(): void {
		this.fastify.get('/:id/participants', this.list.bind(this));
	}

	private async register(req: FastifyRequest, reply: FastifyReply) {
		const tournamentId = Number((req.params as any).id);
		const userId = (req.user as any).id;
		try {
			const part = await this.participantService.register(tournamentId, userId);
			reply.status(201).send(part);
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Error';
			reply.status(400).send({ message: msg});
		}
	}

	private async unregister(req: FastifyRequest, reply: FastifyReply) {
		const tournamentId = Number((req.params as any).id);
		const userId = (req.user as any).id;
		try {
			const part = await this.participantService.unregister(tournamentId, userId);
			reply.send(part);
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Error';
			reply.status(400).send({ message: msg});
		}
	}

	private async list(req: FastifyRequest, reply: FastifyReply) {
		const tournamentId = Number((req.params as any).id);
		const list = await this.participantService.listParticipants(tournamentId);
		reply.send(list);
	}
}