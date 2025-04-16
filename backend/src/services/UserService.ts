import { UserRepository } from "../repositories/UserRepository";
import { UserProfileDTO } from "../dtos/UserProfileDTO";
import bcrypt from 'bcryptjs'

export class UserService {
	private userRepo = new UserRepository();

	async updateProfile(userId: number, profileData: UserProfileDTO) {
		const updateData: UserProfileDTO = { ...profileData };

		if (profileData.password) {
			updateData.password = await bcrypt.hash(profileData.password, 10);
		}

		if (updateData.email) {
			const existingByEmail = await this.userRepo.findByEmail(updateData.email);
			if (existingByEmail && existingByEmail.id !== userId) {
				throw new Error('Email already exists');
			}
		}

		// Проверяем уникальность username, если он передан
		if (updateData.username) {
			const existingByUsername = await this.userRepo.findByUsername(updateData.username);
			if (existingByUsername && existingByUsername.id !== userId) {
				throw new Error('Username already exists');
			}
		}

		return this.userRepo.updateUserProfile(userId, updateData);
	}

	async getProfile( userId: number){
		return this.userRepo.findById(userId);
	}
}