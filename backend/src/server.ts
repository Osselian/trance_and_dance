import Fastify from 'fastify';
import {TypeBoxTypeProvider} from '@fastify/type-provider-typebox';
import fs from 'fs';
import path from 'path';

// server init
const app = Fastify(
	{
		logger: true,
		https: 
		{
			key: fs.readFileSync(path.join(__dirname, 'certs/key.pem')),
			cert: fs.readFileSync(path.join(__dirname, 'certs/cert.pem'))
		}
	}
).withTypeProvider<TypeBoxTypeProvider>();

//test route
app.get('/ping', async (request, reply) => {
  return { status: 'ok', message: 'Pong!' };
});

//server start
const start = async () => 
{
	try 
	{
		await app.listen(
			{
				port: 3000, host: '0.0.0.0'
			}
		);
		console.log('Server is running on http://localhost:3000');
	}
	catch (err)
	{
		app.log.error(err);
		process.exit(1);
	}
};

start();