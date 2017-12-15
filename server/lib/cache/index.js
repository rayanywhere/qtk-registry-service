module.exports = class {
    constructor() {
        this._configMap = new Map();
    }

    addConfig({name, host, port, timeout, socket}) {
        let configs = this._configMap.get(name);
        if (configs === undefined){
            configs = [];
        }
        configs.push({host, port, timeout, socket});

        this._configMap.set(name, configs);
        logger.debug(`[cache]config add host=${host} port=${port}`);
    }

    getConfig(name) {
        let configs = this._configMap.get(name);
        if (configs === undefined){
            return undefined;
        }

        const index = Math.floor(Math.random() * configs.length);
        logger.debug(`[cache]config get ${configs[index].host}:${configs[index].port}`);
        return configs[index];
    }

    existsHostAndPort({host, port}) {
        for (const [name, configs] of this._configMap.entries()) {
            if (configs.findIndex(obj => (obj.host === host && obj.port === port)) !== -1) {
                logger.debug(`[cache]config exist ${host}:${port}`);
                return true;
            }
        }
        logger.debug(`[cache]config not exist ${host}:${port}`);
        return false;
    }

    deleteBySocket(socket) {
        for (const [name, configs] of this._configMap.entries()) {
            const index = configs.findIndex(obj => (obj.socket === socket));
            if (index !== -1) {
                logger.debug(`[cache]config delete ${configs[index].host}:${configs[index].port}`);
                configs.splice(index, 1);
                if (configs.length < 1){
                    this._configMap.delete(name);
                }
                break;
            }
        }
    }
};