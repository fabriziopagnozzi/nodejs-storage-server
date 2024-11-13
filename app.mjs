import Fastify from "fastify";
import userRoutes from "./user-routes.mjs";
import dataRoutes from "./data-routes.mjs";

const fastify = new Fastify({logger: true});
fastify.register(userRoutes);
fastify.register(dataRoutes);

try {
    await fastify.listen({port: 3000});
} catch (e) {
    fastify.log.error(e);
}