import Fastify from "fastify";
import userRoutes from "./user-routes.mjs";
import dataRoutes from "./data-routes.mjs";
import {errorHandler} from "./errors.mjs";

const fastify = new Fastify({logger: true});
fastify.register(userRoutes);
fastify.register(dataRoutes);
fastify.setErrorHandler(errorHandler);
await fastify.listen({port: 3000});