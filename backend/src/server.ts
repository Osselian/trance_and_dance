import Fastify from 'fastify';
import {TypeBoxTypeProvider} from '@fastify/type-provider-typebox';
import fs from 'fs';
import path from 'path';
import fastifyCookie from '@fastify/cookie';
import fastifyJwt from '@fastify/jwt';
import fastifyMultipart from '@fastify/multipart';
import { MatchmakingService } from './services/MatchmakingService';
import { registerRoutes } from './utils/registerRoutes';
import fastifyCors from '@fastify/cors';
import fastifyStatic from '@fastify/static'; 
import {fastifyWebsocket} from '@fastify/websocket';
import {TournamentService} from './services/TournamentService';
import { TournamentMatchService } from './services/TournamentMatchService';

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


fastify.register(fastifyCors, {
	origin: ['https://localhost:8080', 'https://localhost:8081'],
	credentials: true,
	methods: ['GET', 'POST', 'DELETE', 'OPTIONS', 'PUT']
});

fastify.register(fastifyStatic, {
  root: path.join(__dirname, '../data'),
  prefix: '/img/',
  decorateReply: true,       // по умолчанию
});

fastify.register(fastifyStatic, {
  root: path.join(__dirname, '../uploads'),
  prefix: '/uploads/',
  decorateReply: false,
});


fastify.register(fastifyCookie);

fastify.register(fastifyJwt, {
	secret: process.env.ACCESS_TOKEN_SECRET || 'superSecretKey'
});

fastify.register(fastifyMultipart);

fastify.register(require('@fastify/websocket'));
registerRoutes(fastify);

//server start
fastify.listen({ port: 3000, host: '0.0.0.0' }, (err, address) => {
	if (err) {
		fastify.log.error(err);
		process.exit(1);
	}
	fastify.log.info('Server starts at ${address}');
});

const mmService = new MatchmakingService();
setInterval(() => mmService.processQueue().catch(console.error), 1000);

const tournamentService = new TournamentService();
const tournamentMatchService = new TournamentMatchService();

setInterval(async () => {
	try {
		const readyTournaments = await tournamentService.chechAndUpdateTournamentStatus();

		if (readyTournaments.length > 0) {
			console.log(`${readyTournaments.length} tournaments ready to start`);
		}
	} catch (err) {
		console.error('Error checking tournaments:', err);
	}
}, 60000); // every minute

setInterval(async () => {
	try {
		const activeTournaments = await tournamentService.getActiveTournaments();

		for (const tournament of activeTournaments) {
			await tournamentMatchService.checkAndStartNextRoundMatches(tournament.id);
			await tournamentMatchService.checkDisconnectedPlayers(tournament.id);
		}
	} catch (err) {
		console.error('Error in tournament progress check:', err);
	}
}, 30000); // every 30 seconds
