import {readFile, writeFile} from "fs/promises";
import jwt from "jsonwebtoken";
import {v4 as uuidv4} from "uuid";

const secretKey = await readFile("data/key.txt", "utf-8");
const userDataPath = "data/users-data";

async function verifyToken(req) {
    const token = req.headers.authorization.split(" ")[1]; // Bearer <token>

    // decode the token and get email and user role
    let obj = jwt.verify(token, secretKey);
    let {email, isAdmin} = obj;
    let users = JSON.parse(await readFile("data/users.json", "utf8"));

    // the email doesn't exist anymore in the users.json, throw an error
    if (!users[email])
        throw {code: 403, msg: {body: "Unauthorized, user doesn't exist"}};
    else if (isAdmin && req.query.user)
        // the admin can do anything to any possible user specified in the user query argument
        return req.query.user;
    else
        return email;
}

async function getUserID(email) {
    let userIDs, ID, users;
    try {
        users = JSON.parse(await readFile("data/users.json", "utf-8")); // assumed to exist
        userIDs = JSON.parse(await readFile("data/userIDs.json", "utf-8"));
    } catch (e) {
        console.log(e);
        userIDs = {};
    }

    if (userIDs[email])
        ID = userIDs[email];
    else if (users[email]) {
        ID = uuidv4();
        userIDs[email] = ID;
        await writeFile("data/userIDs.json", JSON.stringify(userIDs));
    } else
        throw {code: 404, msg: {body: `No user registered under the email ${email}`}};

    return ID;
}

async function loadUserData(email) {
    let userID, userData;
    userID = await getUserID(email);
    userData = JSON.parse(await readFile(`${userDataPath}/${userID}/keys.json`, 'utf-8'));
    return {userID, userData};
}

export {getUserID, verifyToken, loadUserData};