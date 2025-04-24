import { TournamentParticipantRepository } from 
	"../repositories/TournamentParticipantRepository";
import { TournamentParticipant } from "@prisma/client";

export class TournamentParticipantService {
	constructor(
		private participantRepo = new TournamentParticipantRepository()
	) {}

	async register(tournamentId: number, userId: number): Promise<TournamentParticipant> {
		//TODO: проверка дедлайна, уникальности, прав доступа
		return this.participantRepo.register(tournamentId, userId);
	}

	async unregister(tournamentId: number, userId: number): Promise<TournamentParticipant> {
		//TODO: проверка статуса турнира и прав
		return this.participantRepo.remove(tournamentId, userId);
	}

	async listParticipants(tournamentId: number): Promise<TournamentParticipant[]> {
		return this.participantRepo.findByTournament(tournamentId);
	}
}