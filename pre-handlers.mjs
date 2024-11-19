import {loadUserData, verifyToken} from "./auth-utils.mjs";
import {mutex} from "./app.mjs";

async function authenticateAndLoadData(req, reply) {
    req.release = await mutex.acquire();
    let email = await verifyToken(req);
    let {userID, userData} = await loadUserData(email);
    req.userInfo = {userID, userData, email};
}

async function authenticate(req, reply) {
    req.release = await mutex.acquire();
    req.userInfo = await verifyToken(req);
}

export {authenticate, authenticateAndLoadData}