import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { UserService } from "../../services/UserService";
import fs from 'fs';
import path from 'path';

export class UserController {
	private userService = new UserService();

	constructor(private fastify: FastifyInstance){}

	public registerRoutes(): void {
		this.fastify.get('/profile', this.getProfile.bind(this));
		this.fastify.put('/profile', this.updateProfile.bind(this));
		this.fastify.post('/avatar', this.uploadAvatar.bind(this));
		this.fastify.post('/friend-request', this.sendFriendrequest.bind(this));
		this.fastify.post('/friend-accept', this.acceptFriendrequest.bind(this));
		this.fastify.get('/friends', this.gerFriends.bind(this));
	}

	async getProfile(req: FastifyRequest, reply: FastifyReply) {
		const userId = (req as any).user.id as number;
		const profile = await this.userService.getProfile(userId);
		if (!profile)
			return reply.status(404).send({ message: 'User not found' });
		reply.send(profile);
	}

	async updateProfile(req: FastifyRequest, reply: FastifyReply) {
		const userId = (req as any).user.id as number;
		//get Json data
		const profileData = req.body as Partial<
			{ email: string; username: string; password: string }>;

		try {
			const updatedProfile = await this.userService.updateProfile(userId, profileData);
			reply.send(updatedProfile);
		}
		catch (err) {
			const errorMsg = err instanceof Error ? err.message : 'Unknown error';
			reply.status(400).send({ message: errorMsg });
		}
	}

	async uploadAvatar(req: FastifyRequest, reply: FastifyReply) {
		const userId = (req as any).user.id as number;
		const data = await req.file();

		if (!data) {
			return reply.status(400).send({ message: 'No file uploaded'});
		}

		//set file path
		const uploadDir = path.join(__dirname, '../../../uploads/avatars')
		if (!fs.existsSync(uploadDir)) {
			fs.mkdirSync(uploadDir, { recursive: true});
		}

		//form file name
		const fileName = '${userId}_${Date.now()}_${data.filename}';
		const filePath = path.join(uploadDir, fileName);

		//create stream for file upload
		const writeStream = fs.createWriteStream(filePath);
		await data.file.pipe(writeStream);

		const updatedProfile = await this.userService
			.updateProfile(userId, {avatarUrl: '/uploads/avatars/${fileName}'});
		reply.send({ message: 'Avatar uploaded successfully', profile: updatedProfile});
	}

	async sendFriendrequest(req: FastifyRequest, reply: FastifyReply) {
		const userId = (req as any).user.id as number;
		const { receiverId} = req.body as { receiverId: number};
		const result = await this.userService.sendFriendRequest(userId, receiverId);
		reply.send(result);
	}

	async acceptFriendrequest(req: FastifyRequest, reply: FastifyReply) {
		const userId = (req as any).user.id as number;
		const { requesterId} = req.body as { requesterId: number};
		const result = await this.userService.acceptFriendRequest(userId, requesterId);
		reply.send(result);
	}

	async gerFriends(req: FastifyRequest, reply: FastifyReply) {
		const userId = (req as any).user.id as number;
		const friends = await this.userService.getFriends(userId);
		reply.send(friends);
	}
}