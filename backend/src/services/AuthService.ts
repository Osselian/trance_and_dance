import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/UserRepository';

export class AuthService{
	constructor(private userRepo = new UserRepository()) {}

	async register(email: string, username: string, password: string) {
		const existingUser = await this.userRepo.existsByEmailOrUsername(email, username);
		if (existingUser)
			throw new Error('Username or email already exists');

		const hash = await bcrypt.hash(password, 10);
		return this.userRepo.createUser(email, username, hash);
	}

	async validateUser(email: string, password: string) {
		const user = await this.userRepo.findByEmail(email);
		if (!user || !(await bcrypt.compare(password, user.password)))
			return null;
		return user;
	}

	async getUserById(id: number){
		return this.userRepo.findById(id);
	}
}