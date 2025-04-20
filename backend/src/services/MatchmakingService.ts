import { MatchMakingRequestRepository } from "../repositories/MatchMakingRequestRepository";
import { MatchRepository } from "../repositories/MatchRepository";
import { UserRepository} from "../repositories/UserRepository";
import {Match, MatchStatus, User} from '@prisma/client'

export class MatchmakingService {

	constructor (
		private mmReqRepo = new MatchMakingRequestRepository(),
		private matchRepo = new MatchRepository(),
		private userRepo = new UserRepository()
	) {}

	async joinQueue (userId: number): Promise<void> {
		const existRequest = this.mmReqRepo.findByUser(userId);
		if (existRequest != null)
			throw  new Error("Matchmaking request already exists!");

		const user = await this.userRepo.findById(userId);
		if (user == null)
			throw  new Error("User does not exist!");

		const request = await this.mmReqRepo.create({userId: userId, rating: user.rating})
		this.findAndCreateMatch(userId);
	}

	async leaveQueue(userId: number): Promise<void> {
		await this.mmReqRepo.deleteByUser(userId);
	}

	async findAndCreateMatch(userId: number) {
		const requests = this.mmReqRepo.findAll();

	}

	async processQueue(): Promise<void> {

	}
}


