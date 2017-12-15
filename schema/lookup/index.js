const info = {
    title: "获取server配置信息",
    author: "skip",
    description: "获取server配置信息",
    auth: false
};

const request = {
    type: "string",
    description: "服务名"
};

const response = {
    type: "object",
    description: "返回server的地址，端口，超时时间",
    additionalProperties: false,
    properties: {
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
    required: ["host", "port", "timeout"]
};

module.exports = {info, request, response};