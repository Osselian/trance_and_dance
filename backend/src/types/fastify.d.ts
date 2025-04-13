import '@fastify/jwt'

declare module 'fastify' {

	interface FastifyReply {
		jwtSign(payload: object, options?: object): Promise<string>;
		jwtVerify<T = any>(token?: string): Promise<T>;
	}

	interface FastifyRequest {
		jwtVerify(): Promise<{ id: number}>;
	}
}