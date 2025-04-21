import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

type ControllerConstructor = new (app: FastifyInstance) => any;

export function registerSecure(
	fastify: FastifyInstance,
  	prefix: string,
  	controllerCtor: ControllerConstructor,
  	methodName: keyof InstanceType<typeof controllerCtor>) 
{
  fastify.register(async (app) => {
    // общий preHandler
	app.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
		try {
			await request.jwtVerify();
		}
		catch (err){
			reply.status(401).send({message: 'Unauthorized'});
		}
	});
    new controllerCtor(app)[methodName]();
  }, { prefix });
}