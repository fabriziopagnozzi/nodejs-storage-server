import {loadUserData, verifyToken} from "./auth-utils.mjs";

async function authenticateAndLoadData(req, reply) {
    try {
        let email = await verifyToken(req);
        let {userID, userData} = await loadUserData(email);
        req.userInfo = {userID, userData, email};
    } catch (e) {
        return reply.code(e.code).send(e.msg);
    }
}

async function authenticate(req, reply) {
    try {
        req.userInfo = await verifyToken(req);
    } catch (e) {
        return reply.code(e.code).send(e.msg);
    }
}

export {authenticate, authenticateAndLoadData}