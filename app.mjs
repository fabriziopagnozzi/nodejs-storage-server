import Fastify from "fastify";
import userRoutes from "./user-routes.mjs";
import dataRoutes from "./data-routes.mjs";

const fastify = new Fastify({logger: true});
fastify.register(userRoutes);
fastify.register(dataRoutes);

class ServerError extends Error {
    constructor(code, msg) {
        super();
        this.code = code;
        this.msg = msg;
    }
}

fastify.setErrorHandler((e, req, reply) => {
    if (e.name === "TokenExpiredError")
        reply.code(404).send({code: 404, body: "Session token expired, please login again"});
    else if (e.code === "ENOENT")
        reply.code(404).send({code:404, body: "No such file found"});
    else if (e instanceof ServerError)
        reply.code(e.code).send({code: e.code, body: e.msg});
    else
        reply.send(e);
});

try {
    await fastify.listen({port: 3000});
} catch (e) {
    fastify.log.error(e);
}

export {ServerError}