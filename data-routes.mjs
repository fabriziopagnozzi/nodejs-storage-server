import {authenticateAndLoadData} from "./pre-handlers.mjs";
import {postSchema, patchSchema} from "./schemas.mjs";
import {ServerError} from "./errors.mjs";
import {writeFile} from "fs/promises";

// each user has their own directory under "data/users-data" to store and read their own data
// the admin can access and modify data within all user directories
const userDataPath = "data/users-data";

async function routes(fastify, options) {

    fastify.post("/data", {schema: {body: postSchema}, preHandler: authenticateAndLoadData},
        async (req, reply) => {
            const {email, userID, userData} = req.userInfo;
            const {key, data} = req.body;

            if (userData[key])
                throw new ServerError(400, "The key already exists")
            else {
                userData[key] = data;
                let dataToWrite = JSON.stringify(userData, null, 2);
                await writeFile(`${userDataPath}/${userID}/keys.json`, dataToWrite);
                return reply.code(200).send({body: `Key ${key} successfully added for user ${email}`});
            }
        }
    );


    fastify.get("/data/:key", {preHandler: authenticateAndLoadData},
        async (req, reply) => {
            const {key} = req.params;
            const {email, userData} = req.userInfo;

            if (userData[key])
                return reply.code(200).send({key, data: userData[key]});
            else
                throw new ServerError(404, `No such key found for the user ${email}`)
        }
    );


    // PATCH expects the resource to be present, otherwise returns an error to the client
    fastify.patch("/data/:key", {schema: {body: patchSchema}, preHandler: authenticateAndLoadData},
        async (req, reply) => {
            const {key} = req.params;
            const {userID, userData} = req.userInfo;

            if (userData[key]) {
                userData[key] = req.body.data;
                let dataToWrite = JSON.stringify(userData, null, 2);
                await writeFile(`${userDataPath}/${userID}/keys.json`, dataToWrite);
                return reply.code(200).send({body: "Resource correctly updated"});
            } else
                throw new ServerError(400, "The resource to update does not exist");
        }
    );


    fastify.delete("/data/:key", {preHandler: authenticateAndLoadData},
        async (req, reply) => {
            const {key} = req.params;
            const {email, userID, userData} = req.userInfo;

            if (userData[key]) {
                delete userData[key];
                let dataToWrite = JSON.stringify(userData, null, 2);
                await writeFile(`${userDataPath}/${userID}/keys.json`, dataToWrite);
                return reply.code(200).send({body: `Resource deleted for user ${email}`});
            } else
                throw new ServerError(400, "The resource to delete does not exist");
        }
    );
}

export default routes;