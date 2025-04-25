import { PrismaClient, Tournament} from '@prisma/client'
import { TournamentDto as TournamentDto } from '../dtos/TournamentDto';

const prisma = new PrismaClient();

export class TournamentRepository {
	async create(data: TournamentDto): Promise<Tournament> {
		return prisma.tournament.create({ data});
	}

	async findById(id: number): Promise<Tournament | null> {
		return prisma.tournament.findUnique({ where: { id: id}});
	}

	async findAll(): Promise<Tournament[]> {
		return prisma.tournament.findMany({ orderBy:  { startDate: 'asc'}})
	}

	async update( id: number, data: TournamentDto): Promise<Tournament> {
		return prisma.tournament.update({ where: { id }, data});
	}

	async delete(id: number): Promise<Tournament> {
		return prisma.tournament.delete({ where: { id}});
	}
}