import {loadUserData, verifyToken} from "./auth-utils.mjs";

async function authenticateAndLoadData(req, reply) {
    let email = await verifyToken(req);
    let {userID, userData} = await loadUserData(email);
    req.userInfo = {userID, userData, email};
}

async function authenticate(req, reply) {
    req.userInfo = await verifyToken(req);
}

export {authenticate, authenticateAndLoadData}