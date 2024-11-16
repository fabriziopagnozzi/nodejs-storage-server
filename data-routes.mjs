import {writeFile} from "fs/promises";
import {authenticateAndLoadData} from "./pre-handlers.mjs";

// each user has their own directory under "data/users-data" to store and read their own data
// the admin can access and modify data within all user directories
const userDataPath = "data/users-data";

const postSchema = {
    type: "object",
    required: ["key", "data"],
    properties: {
        key: {type: "string"},
        data: {
            type: "string",
            // pattern contains the regexp for base64 strings
            pattern:
                "^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$",
        },
    }
};

const patchSchema = {
    type: "object",
    required: ["data"],
    properties: {
        data: {
            type: "string",
            pattern:
                "^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$",
        },
    }
};

async function routes(fastify, options) {

    fastify.post("/data", {schema: {body: postSchema}, preHandler: authenticateAndLoadData},
        async (req, reply) => {
            const {email, userID, userData} = req.userInfo;
            const {key, data} = req.body;

            // Add the data. If the key already exists, don't do anything and return an error
            try {
                if (userData[key]) {
                    return reply.code(400)
                        .send({body: "The key already exists"});
                } else {
                    userData[key] = data;
                    await writeFile(`${userDataPath}/${userID}/keys.json`, JSON.stringify(userData));
                    return reply.code(200)
                        .send({body: `Key ${key} successfully added for user ${email}`});
                }
            } catch (e) {
                fastify.log.error(e);
                if (e.code === "ENOENT")
                    return reply.code(500)
                        .send({body: "Error in server file system, try again later"});
            }
        }
    );


    fastify.get("/data/:key", {preHandler: authenticateAndLoadData},
        async (req, reply) => {
            const {email, userData} = req.userInfo;
            const {key} = req.params;

            if (userData[key])
                return reply.code(200)
                    .send({key, data: userData[key]});
            else
                return reply.code(404)
                    .send({body: `No such file found for the user ${email}`});
        }
    );


    // PATCH expects the resource to be present, otherwise returns an error to the client
    fastify.patch("/data/:key", {schema: {body: patchSchema}, preHandler: authenticateAndLoadData},
        async (req, reply) => {
            const {key} = req.params;
            const {userID, userData} = req.userInfo;

            try {
                if (userData[key]) {
                    userData[key] = req.body.data;
                    await writeFile(`${userDataPath}/${userID}/keys.json`, JSON.stringify(userData));

                    return reply.code(200)
                        .send({body: "Resource correctly updated"});
                } else
                    return reply.code(400)
                        .send({body: "The resource to update does not exist"});
            } catch (e) {
                fastify.log.error(e);
                if (e.code === "ENOENT")
                    return reply.code(500)
                        .send({body: "Error in server file system, try again later"});
            }
        }
    );


    fastify.delete("/data/:key", {preHandler: authenticateAndLoadData},
        async (req, reply) => {
            const {key} = req.params;
            const {email, userID, userData} = req.userInfo;

            try {
                if (userData[key]) {
                    delete userData[key];
                    await writeFile(`${userDataPath}/${userID}/keys.json`, JSON.stringify(userData));
                    return reply.code(200)
                        .send({body: `Resource deleted for user ${email}`});
                } else {
                    return reply.code(400)
                        .send({body: "The resource to delete does not exist"});
                }
            } catch (e) {
                fastify.log.error(e);
                if (e.code === "ENOENT") {
                    return reply.code(500)
                        .send({body: "Error in server file system, try again later"});
                }
            }
        }
    );
}

export default routes;
