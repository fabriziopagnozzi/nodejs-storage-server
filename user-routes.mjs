import {mkdir, readFile, writeFile, rm} from "fs/promises";
import {createHash} from "crypto";
import jwt from "jsonwebtoken";
import {getUserID} from "./auth-utils.mjs";
import {authenticate} from "./pre-handlers.mjs";
import {userdataSchema} from "./schemas.mjs";

// the key used to generate and validate tokens is unique and stored in the key.txt file
const secretKey = await readFile("data/key.txt", "utf-8");
// each user has their own directory under this path to store and read their own data
// the admin can access and modify data within all user directories
const userDataPath = "data/users-data";


async function routes(fastify, options) {

    fastify.post("/register", {schema: {body: userdataSchema}},
        async (req, reply) => {
            const {email, password} = req.body;
            const hashedPassword = createHash("sha256")
                .update(password).digest("hex");

            // reading the users' file, checking if there's already a user
            // registered under the current email; if not so, adding new email and password to file
            let users = JSON.parse(await readFile("data/users.json", "utf-8"));

            if (users[email])
                return reply.code(400).send({body: "User already registered"});
            else {
                users[email] = hashedPassword;

                // save the user login info in the users.json file
                await writeFile("data/users.json", JSON.stringify(users));

                // each user will post their {key, value} pairs in a separate directory
                // each user can retrieve only their own data
                let userID = await getUserID(email);
                await mkdir(`${userDataPath}/${userID}`, {recursive: true});
                await writeFile(`${userDataPath}/${userID}/keys.json`, "{}");

                return reply.code(200).send({body: `User ${email} correctly registered`});
            }
        },
    );


    fastify.post("/login", {schema: {body: userdataSchema}},
        async (req, reply) => {
            const {email, password} = req.body;
            const hashedPassword = createHash("sha256")
                .update(password).digest("hex");

            // reading the users' file, checking if there's already a user
            // registered under the current email, finally add the new user to the file
            let users = JSON.parse(await readFile("data/users.json", "utf-8"));

            if (!users[email]) {
                return reply.code(403).send({body: "Unauthorized, user doesn't exist"});
            } else if (users[email] === hashedPassword) {
                let isAdmin = email === "admin@admin.admin";
                const payload = {email, isAdmin};
                const token = jwt.sign(payload, secretKey, {expiresIn: '48h'});
                return reply.code(200).send({token});
            } else
                return reply.code(400).send({body: "Invalid password"});
        }
    );


    fastify.delete("/delete", {preHandler: authenticate}, async (req, reply) => {
        let email = req.userInfo;
        let users = JSON.parse(await readFile("data/users.json", "utf-8"));
        let userIDs = JSON.parse(await readFile("data/userIDs.json", "utf-8"));
        let userID = await getUserID(email);
        delete users[email];
        delete userIDs[email];

        // remove the directory storing user data
        await rm(`${userDataPath}/${userID}`, {recursive: true, force: true});
        // update user login info and userID info
        await writeFile("data/users.json", JSON.stringify(users));
        await writeFile("data/userIDs.json", JSON.stringify(userIDs));

        reply.code(200).send({body: `Successfully deleted user ${email} and all their data`});
    });
}

export default routes;
