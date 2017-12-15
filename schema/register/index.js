const info = {
    title: "注册server配置信息",
    author: "skip",
    description: "注册server配置信息",
    auth: false
};

const request = {
    type: "object",
    description: "注册server信息，包括名字，地址，端口，超时时间",
    additionalProperties: false,
    properties: {
        name: {
            type: "string",
            description: "服务名"
        },
        host: {
            type: "string",
            description: "地址"
        },
        port: {
            type : "integer",
            description : `端口`
        },
        timeout: {
            type : "integer",
            description : `超时时间`
        }
    },
    required: ["name", "host", "port", "timeout"]
};

const response = {};

module.exports = {info, request, response};