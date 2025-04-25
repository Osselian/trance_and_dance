import { TournamentDto as TournamentDto } from "../dtos/TournamentDto";
import { TournamentRepository } from "../repositories/TournamentRepository";
import { Tournament } from "@prisma/client";

export class TournamentService {
	constructor(
		private tournmamentRepo = new TournamentRepository()
	) {}

	async createTournament(data: TournamentDto): Promise<Tournament> {
		return this.tournmamentRepo.create(data);
	}

	async getTournament(id: number): Promise<Tournament | null> {
		return this.tournmamentRepo.findById(id);
	}

	async listTournaments(): Promise<Tournament[]> {
		return this.tournmamentRepo.findAll();
	}

	async updateTournament(id: number, updates: TournamentDto): Promise<Tournament> {
		//TODO: проверка наличия турнира, права доступа, валидация
		return this.tournmamentRepo.update(id, updates);
	}

	async removeTournament(id: number): Promise<Tournament> {
		return this.tournmamentRepo.delete(id);
	}
}