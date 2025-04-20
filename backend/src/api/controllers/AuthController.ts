import { FastifyInstance, FastifyRequest, FastifyReply} from "fastify";
import { AuthService } from "../../services/AuthService";

export class AuthController{

	private authService = new AuthService();

	constructor(private fastify: FastifyInstance) {}

	//routes registration
	public registerRoutes(): void {

		this.fastify.post('/auth/register', this.register.bind(this));
		this.fastify.post('/auth/login', this.login.bind(this));
		this.fastify.post('/auth/refresh-token', this.refreshToken.bind(this));
		this.fastify.post('/auth/logout', this.logout.bind(this));
		this.fastify.post('/auth/google', this.googleLogin.bind(this))
	}

	//user registration
	public async register(request: FastifyRequest, reply: FastifyReply): Promise<void> {
		
		const {email, username, password} = request.body as any;
		
		try {
			const user = await this.authService.register(email, username, password);
			//token generation
			const accessToken = await this.generateToken(user.id, reply);
			reply.status(201).send({ accessToken });
		}
		catch (err){
			const errMsg = err instanceof Error ? err.message : 'Unknown error';
			reply.status(400).send({ message: errMsg });
		}
	}

	//user auth
	async login (request: FastifyRequest, reply: FastifyReply): Promise<void>{

		const {email, password} = request.body as any;
		const user = await this.authService.validateUser(email, password);

		if (!user){
			reply.status(400).send({message: 'Invalid credentials.'});
			return;
		}

		const accessToken = await this.generateToken(user.id, reply);
		reply.send({ accessToken});
	}

	async googleLogin(req: FastifyRequest, reply: FastifyReply){
		const { googleToken } = req.body as { googleToken: string};

		const user = await this.authService.verifyGoogleTokenAndLogin(googleToken)
		const token = await this.generateToken(user.id, reply);
		reply.send({ token});
	}

	async refreshToken(req: FastifyRequest, reply: FastifyReply){
		const refreshToken = req.cookies.refreshToken;
		if (!refreshToken){
			reply.status(401).send({message: "No refresh token!"});
			return;
		}

		try{
			const payload = await this.fastify.jwt.verify<{ id: number}>(refreshToken);
			const user = await this.authService.getUserById(payload.id);
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

	private async generateToken(userId: number, reply: FastifyReply) {
		const accessToken = await this.fastify.jwt.sign({ id: userId }, { expiresIn: '15m' });
		const refreshToken = await this.fastify.jwt.sign({ id: userId }, { expiresIn: '7d' });

		// set token to HttpOnly cookie
		reply.setCookie('refreshToken', refreshToken, {
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			path: '/',
			maxAge: 7 * 24 * 60 * 60 //7 days
		});
		return accessToken;
	}
}