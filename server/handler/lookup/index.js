module.exports = async ({request: name, socket}) => {
    logger.debug(`client  looking up ${name}...`);

    let config = cache.getConfig(name);
    if (config === undefined) {
        throw new Error(`no such record:${name}`);
    }
    return {
        host: config.host,
        port: config.port,
        timeout: config.timeout
    };
};
