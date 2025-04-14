import { PrismaClient, User } from "@prisma/client";

const prisma = new PrismaClient();

export class UserRepository{
	async findByEmail(email: string){
		return prisma.user.findUnique({where: { email } });
	}

	async findById(id: number){
		return prisma.user.findUnique({ where: { id } });
	}

	async existsByEmailOrUsername(email: string, username: string){
		return prisma.user.findFirst({
			where: { OR: [ {email}, { username}] }
		});
	}

	async createUser(email: string, username: string, password: string): Promise<User> {
		return prisma.user.create({
			data: { email, username, password }
		})
	}
}