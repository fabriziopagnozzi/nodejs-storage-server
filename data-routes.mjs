import {readFile, mkdir, writeFile} from "fs/promises";
import {getUserID, verifyToken, loadUserData} from "./auth-utils.mjs";
import {v4 as uuidv4} from "uuid";

// the key used to generate and validate tokens is unique and stored in the key.txt file
const secretKey = await readFile("data/key.txt");
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

    fastify.post("/data", {schema: {body: postSchema}}, async (req, reply) => {
        let email, userID, userData;
        try {
            email = await verifyToken(req);
            ({userID, userData} = await loadUserData(email));
        } catch (e) {
            return reply.code(e.code).send(e.msg);
        }

        const {key, data} = req.body;
        // add the data. If the key already exists, don't do anything and return an error
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
    });

    fastify.get("/data/:key", async (req, reply) => {
        let {key} = req.params;

        let email, userID, userData;
        try {
            email = await verifyToken(req);
            (({userID, userData} = await loadUserData(email)));
        } catch (e) {
            return reply.code(e.code).send(e.msg);
        }

        if (userData[key])
            return reply.code(200)
                .send({key, data: userData[key]});
        else
            return reply.code(404)
                .send({body: `No such file found for the user ${email}`});
    });

    // PATCH expects the resource to be present, otherwise returns an error to the client
    fastify.patch("/data/:key", {schema: {body: patchSchema}}, async (req, reply) => {
        let {key} = req.params;

        let userID, userData;
        try {
            let email = await verifyToken(req);
            ({userID, userData} = await loadUserData(email));
        } catch (e) {
            return reply.code(e.code).send(e.msg);
        }

        // update the data
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
    });

    fastify.delete("/data/:key", async (req, reply) => {
        let {key} = req.params;

        let email, userID, userData;
        try {
            email = await verifyToken(req);
            (({userID, userData} = await loadUserData(email)));
        } catch (e) {
            return reply.code(e.code).send(e.msg);
        }

        // delete the data.
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
    });
};

export default routes;
