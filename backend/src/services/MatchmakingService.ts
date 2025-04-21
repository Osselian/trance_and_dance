import { MatchMakingRequestRepository } from "../repositories/MatchMakingRequestRepository";
import { UserRepository} from "../repositories/UserRepository";
import { MatchmakingRepository } from "../repositories/MatchmakingRepository";
import {Match, MatchMakingRequest} from '@prisma/client'

export class MatchmakingService {

	constructor (
		private mmReqRepo = new MatchMakingRequestRepository(),
		private userRepo = new UserRepository(),
		private mmRepo = new MatchmakingRepository(),
	) {}

	async joinQueue (userId: number): Promise<void> {
		const existRequest = await this.mmReqRepo.findByUser(userId);
		if (existRequest != null)
			throw  new Error("Matchmaking request already exists!");

		const user = await this.userRepo.findById(userId);
		if (user == null)
			throw  new Error("User does not exist!");

		await this.mmReqRepo.create({userId: userId, rating: user.rating});
	}

	async leaveQueue(userId: number): Promise<void> {
		await this.mmReqRepo.deleteByUser(userId);
	}

	async processQueue(): Promise<Match[]> {
		const result: Match[] = [];
		const requests = (await this.mmReqRepo.findAll())
			.sort((prev, cur) => prev.createdAt.getTime() - cur.createdAt.getTime());			
		
		const pairs = this.getPairs(requests);
		for (const pair of pairs)
		{
			const match = await this.mmRepo
				.createMatchAndCleanup(pair[0].userId, pair[1].userId);
			result.push(match);
		}
		return result;
	}

	private getPairs(requests: MatchMakingRequest[]): [MatchMakingRequest, MatchMakingRequest][] {
		const result: [MatchMakingRequest, MatchMakingRequest][] = [];
		const used = new Set<number>();

		for (let i = 0; i < requests.length - 1; i++) {
			if (used.has(i))
				continue;

			let minDiff = Infinity;
			let bestMatchIndex = -1;

			for (let j = i + 1; j < requests.length; j++) {
				if (used.has(j))
					continue;
				const diff = Math.abs(requests[i].rating - requests[j].rating);
				if (diff < minDiff) {
					minDiff = diff;
					bestMatchIndex = j;
				}
				if (diff === 0)
					break;
			}

			if (bestMatchIndex !== -1) {
				result.push([requests[i], requests[bestMatchIndex]]);
				used.add(i);
				used.add(bestMatchIndex);
			}
		}
		return result;
	}
}