module.exports = async ({request, socket}) => {
    logger.debug(`client registering with params(${JSON.stringify(request)})...`);
    
    //检查注册信息是否重复
    if (cache.existsHostAndPort({host: request.host, port: request.port})) {
        throw new Error(`register config(${request.host}:${request.port}) existed)`);
    }
    
    //添加映射关系
    cache.addConfig({
        name: request.name,
        host: request.host,
        port: request.port,
        timeout: request.timeout,
        socket: socket
    });
};
