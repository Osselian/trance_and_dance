import Fastify, { FastifyReply, FastifyRequest } from 'fastify';
import {TypeBoxTypeProvider} from '@fastify/type-provider-typebox';
import fs from 'fs';
import path from 'path';
import fastifyCookie from '@fastify/cookie';
import fastifyJwt from '@fastify/jwt';
import { AuthController } from './api/controllers/AuthController';
import { UserController } from './api/controllers/UserController';
import fastifyMultipart from '@fastify/multipart';

// server init
const fastify = Fastify(
	{
		logger: true,
		https: 
		{
			key: fs.readFileSync(path.join(__dirname, '../certs/key.pem')),
			cert: fs.readFileSync(path.join(__dirname, '../certs/cert.pem'))
		}
	}
).withTypeProvider<TypeBoxTypeProvider>();

//test route
fastify.get('/ping', async (request, reply) => {
  return { status: 'ok', message: 'Pong!' };
});

fastify.register(fastifyCookie);
fastify.register(fastifyJwt, {
	secret: process.env.ACCESS_TOKEN_SECRET || 'superSecretKey'
});
fastify.register(fastifyMultipart);

const auth = new AuthController(fastify);
auth.registerRoutes();

fastify.register(async (app) => {
	//add hook
	app.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
		try {
			await request.jwtVerify();
		}
		catch (err){
			reply.status(401).send({message: 'Unauthorized'});
		}
	});

	//controller registration
	const userController = new UserController(app);
	userController.registerRoutes();
}, {prefix: '/user'});

//server start
fastify.listen({ port: 3000, host: '0.0.0.0' }, (err, address) => {
	if (err) {
		fastify.log.error(err);
		process.exit(1);
	}
	fastify.log.info('Server starts at ${address}');
});