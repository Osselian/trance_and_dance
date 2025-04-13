import Fastify from 'fastify';
import {TypeBoxTypeProvider} from '@fastify/type-provider-typebox';
import fs from 'fs';
import path from 'path';
import fastifyCookie from '@fastify/cookie';
import fastifyJwt from '@fastify/jwt';
import { AuthController } from './api/controllers/AuthController';

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

const auth = new AuthController(fastify);
auth.registerRoutes();

//server start
fastify.listen({ port: 3000, host: '0.0.0.0' }, (err, address) => {
	if (err) {
		fastify.log.error(err);
		process.exit(1);
	}
	fastify.log.info('Server starts at ${address}');
});