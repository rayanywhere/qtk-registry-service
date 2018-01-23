const {object, string, integer} = require('semantic-schema').describer;

const info = {
    title: "获取server配置信息",
    author: "skip",
    description: "获取server配置信息",
    auth: false
};

const request = string().desc("服务名");

const response = object().requiredAll().desc("返回server的地址，端口，超时时间").properties({
    host: string().desc("地址"),
    port: integer().desc("端口"),
    timeout: integer().desc("超时时间")
});

module.exports = {info, request, response};