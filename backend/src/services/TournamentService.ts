import { TournamentDto as TournamentDto } from "../dtos/TournamentDto";
import { TournamentParticipantRepository } from "../repositories/TournamentParticipantRepository";
import { TournamentRepository } from "../repositories/TournamentRepository";
import { Tournament, TournamentStatus } from "@prisma/client";

export interface CreateTournamentDto extends TournamentDto {
	requiredPlayers: number;
}

export class TournamentService {
	constructor(
		private tournmamentRepo = new TournamentRepository(),
		private participantRepo = new TournamentParticipantRepository()
	) {}

	async createTournament(data: CreateTournamentDto): Promise<Tournament> {
		//Players amount validation - only 4, 8 or 16 players allowed
		if (![4, 8, 16].includes(data.requiredPlayers)) {
			throw new Error("Invalid number of players. Only 4, 8 or 16 are allowed.");
		}
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

	async checkTournamentStatus(tournamentId: number): 
		Promise<{isReady: boolean, playersCount: number, requiredPlayers: number}> 
	{
		const tournament = await this.tournmamentRepo.findById(tournamentId);
		if (!tournament) {
			throw new Error("Tournament not found");
		}

		const participants = await this.participantRepo.findByTournament(tournamentId);
		const isReady = participants.length >= tournament.requiredPlayers;

		return {
			isReady,
			playersCount: participants.length,
			requiredPlayers: tournament.requiredPlayers,
		};
	}

	async chechAndUpdateTournamentStatus(): Promise<Tournament[]> {
		const readyTournaments: Tournament[] = [];
		const tournaments: Tournament[] = await this.tournmamentRepo.findTournamentReadyToStart();

		for (const tournament of tournaments) {
			// Fetch participants for the tournament
			const participants = await this.participantRepo.findByTournament(tournament.id);
			// Check if the tournament has enough participants
			if (participants.length >= tournament.requiredPlayers) {
				// Update the tournament status to "started"
				const updated = await this.tournmamentRepo.updateStatus(tournament.id, TournamentStatus.READY); 
				readyTournaments.push(tournament);
			}
		}
		return readyTournaments;
	}

	async updateTournamentRound(tournamentId: number, round: number): 
		Promise<Tournament> 
	{
		return this.tournmamentRepo.updateCurrentRound(tournamentId, round);
	}

	async setTournamentWinner(tournamentId: number, winnerId: number):
		Promise<Tournament>
	{
		return this.tournmamentRepo.updateWinner(tournamentId, winnerId);
	}
}