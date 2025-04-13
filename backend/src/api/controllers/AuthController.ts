import { FastifyInstance, FastifyRequest, FastifyReply} from "fastify";
import bcrypt from 'bcryptjs';
import { PrismaClient } from "@prisma/client";
import fastifyJWT from '@fastify/jwt';
import fastifyCookie from "@fastify/cookie";

const prisma = new PrismaClient();

interface RegisterBody {
	email: string;
	username: string;
	password: string;
}

interface LoginBody {
	email: string;
	password: string;
}

export class AuthController{
	constructor(private fastify: FastifyInstance) {}

	//user registration
	public async register(request: FastifyRequest, reply: FastifyReply): Promise<void> {
		const {email, username, password} = request.body as RegisterBody;
		
		//is user exists
		const existingUser = await prisma.user.findFirst({ 
			where: { OR: [{email}, { username}]}
		});

		if (existingUser) {
			reply.status(400).send({message: 'Username or email already exists.'});
			return;
		}

		//hashing
		const saltRounds = 10;
		const hashedPassword = await bcrypt.hash(password, saltRounds);

		//user creation
		const user = await prisma.user.create({
			data: {
				email,
				username,
				password: hashedPassword
			}
		});

		//token generation
		const accessToken = await this.fastify.jwt.sign({ id: user.id}, { expiresIn: '15m'});
		const refreshToken = await this.fastify.jwt.sign({ id: user.id}, { expiresIn: '7d'});

		// set token to HttpOnly cookie
		reply.setCookie('refreshToken', refreshToken, {
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			path: '/',
			maxAge: 7 * 24 * 60 * 60 //7 days
		});

		reply.status(201).send({ accessToken });
	}

	//user auth
	public async login (request: FastifyRequest, reply: FastifyReply): Promise<void>{
		const {email, password} = request.body as LoginBody;

		const user = await prisma.user.findUnique({where: {email}});
		if (!user){
			reply.status(400).send({message: 'Invalid credentials.'});
			return;
		}

		const valid = await bcrypt.compare(password, user.password);
		if (!valid){
			reply.status(400).send({message: 'Invalid credentials.'});
			return;
		}

		//token generation
		const accessToken = await this.fastify.jwt.sign({ id: user.id}, { expiresIn: '15m'});
		const refreshToken = await this.fastify.jwt.sign({ id: user.id}, { expiresIn: '7d'});

		// set token to HttpOnly cookie
		reply.setCookie('refreshToken', refreshToken, {
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			path: '/',
			maxAge: 7 * 24 * 60 * 60 //7 days
		});

		//JWT generation
		reply.send({ accessToken});
	}

	async refreshToken(req: FastifyRequest, reply: FastifyReply){
		const refreshToken = req.cookies.refreshToken;
		if (!refreshToken){
			reply.status(401).send({message: "No refresh token!"});
			return;
		}

		try{
			const payload = await this.fastify.jwt.verify<{ id: number}>(refreshToken);
			const user = await prisma.user.findUnique({ where: { id: payload.id } });
			if (!user)
				throw new Error("User not found!");

			const newAccessToken = await this.fastify.jwt.sign({ id: user.id }, {expiresIn: '15m' });
			reply.send({ accessToken: newAccessToken });
		}
		catch (err){
			reply.status(403).send({ message: 'Invalid refresh token.'});
		}
	}

	async logout(req: FastifyRequest, reply: FastifyReply): Promise<void>{
		reply.clearCookie('refreshToken', {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'strict'
		});
		reply.send({ message: 'You successfully logout.'});
	}

	//routes registration
	public registerRoutes(): void {
		this.fastify.post('/auth/register', this.register.bind(this));
		this.fastify.post('/auth/login', this.login.bind(this));
		this.fastify.post('/auth/refresh-token', this.refreshToken.bind(this));
		this.fastify.post('/auth/logout', this.logout.bind(this));
	}
}