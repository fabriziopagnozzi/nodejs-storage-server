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

const userdataSchema = {
    type: "object",
    required: ["email", "password"],
    properties: {
        email: {type: "string", format: "email"},
        password: {type: "string", minLength: 8},
    },
};

export {postSchema, userdataSchema, patchSchema};
