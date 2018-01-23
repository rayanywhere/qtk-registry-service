const {object, string, integer, empty} = require('semantic-schema').describer;

const info = {
    title: "注册server配置信息",
    author: "skip",
    description: "注册server配置信息",
    auth: false
};

const request = object().requiredAll().desc("注册server信息，包括名字，地址，端口，超时时间").properties({
    name: string().desc("服务名"),
    host: string().desc("地址"),
    port: integer().desc("端口"),
    timeout: integer().desc("超时时间")
});

const response = empty();

module.exports = {info, request, response};