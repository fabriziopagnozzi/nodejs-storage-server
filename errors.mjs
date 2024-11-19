class ServerError extends Error {
    constructor(code, msg) {
        super();
        this.code = code;
        this.msg = msg;
    }
}

function errorHandler(e, req, reply) {
    if (e.name === "TokenExpiredError")
        reply.code(404).send({code: 404, body: "Session token expired, please login again"});
    else if (e instanceof ServerError)
        reply.code(e.code).send({code: e.code, body: e.msg});
    else
        reply.send(e);
}

export {errorHandler, ServerError}