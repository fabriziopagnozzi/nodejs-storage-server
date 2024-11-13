import {readFile, writeFile} from "fs/promises";
import jwt from "jsonwebtoken";
import {v4 as uuidv4} from "uuid";

const secretKey = await readFile("data/key.txt");
const userDataPath = "data/users-data";

async function verifyToken(req) {
    const token = req.headers.authorization.split(" ")[1]; // Bearer <token>

    try {
        // decode the token and get email and user role
        let {email, isAdmin} = jwt.verify(token, secretKey);
        let users = JSON.parse(await readFile("data/users.json"));

        // the email doesn't exist anymore in the users.json, throw an error
        if (!users[email])
            throw {code: 403, msg: {body: "Unauthorized, user doesn't exist"}};
        else {
            // the admin can do anything to any possible user specified in the user query argument
            if (isAdmin && req.query.user)
                return req.query.user;
            else
                return email;
        }
    } catch (e) {
        // the token may have expired, jwt.verify throws the following error
        if (e.name === "TokenExpiredError")
            throw {code: 403, msg: {body: "Session token expired, please login again"}};
        else
            throw e;
    }
}

async function getUserID(email) {
    let userIDs, ID, users;
    try {
        users = JSON.parse(await readFile("data/users.json")); // assumed to exist
        userIDs = JSON.parse(await readFile("data/userIDs.json"));
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
    try {
        userID = await getUserID(email);
        userData = JSON.parse(await readFile(`${userDataPath}/${userID}/keys.json`));
    } catch (e) {
        if (e.code === "ENOENT")
            throw {code: 404, msg: {body: "No such file found"}};
        else
            throw e; // getUserID already throws an error with the code and msg to return,
                     // which must be thrown back to the handler that will send the reply
    }
    return {userID, userData};
}

export {getUserID, verifyToken, loadUserData};