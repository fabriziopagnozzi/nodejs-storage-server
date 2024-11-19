import Fastify from "fastify";
import userRoutes from "./user-routes.mjs";
import dataRoutes from "./data-routes.mjs";
import {errorHandler} from "./errors.mjs";
import {Mutex} from "async-mutex";

// ensure atomicity of requests using Mutex
const mutex = new Mutex();
const fastify = new Fastify({logger: true});
fastify.addHook("onResponse", async (req) => {
    if (req.release)
        await req.release();
});

fastify.register(userRoutes);
fastify.register(dataRoutes);
fastify.setErrorHandler(errorHandler);
await fastify.listen({port: 3000});

export {mutex};