import {readFile, writeFile} from "fs/promises";
import jwt from "jsonwebtoken";
import {v4 as uuidv4} from "uuid";
import {ServerError} from "./errors.mjs"

const secretKey = await readFile("data/key.txt", "utf-8");
const userDataPath = "data/users-data";


async function verifyToken(req) {
    const token = req.headers.authorization.split(" ")[1]; // Bearer <token>

    const {email, isAdmin} = jwt.verify(token, secretKey);
    let users = JSON.parse(await readFile("data/users.json", "utf-8"));

    if (!users[email])
        throw new ServerError(403, `No user registered under the email ${email}`);
    else if (isAdmin && req.query.user)
        // the admin can do anything to any possible user specified in the user query argument
        return req.query.user;
    else
        return email;
}


async function getUserID(email) {
    let ID, users;
    users = JSON.parse(await readFile("data/users.json", "utf-8"));

    if (!users[email])
        throw new ServerError(403, `No user registered under the email ${email}`);
    else if (users[email] && !users[email].userID) {
        ID = uuidv4();
        users[email].userID = ID;
        let dataToWrite = JSON.stringify(users, null, 2);
        await writeFile("data/users.json", dataToWrite)
    } else
        ID = users[email].userID;

    return ID;
}


async function loadUserData(email) {
    let userID, userData;
    userID = await getUserID(email);
    userData = JSON.parse(await readFile(`${userDataPath}/${userID}/keys.json`, "utf-8"));
    return {userID, userData};
}


export {getUserID, verifyToken, loadUserData};