const Client = require('@qtk/schema-tcp-request-framework').Client;

module.exports = class {
    constructor(host, port) {
        this.persistentClient = null;
        this.host = host;
        this.port = port;
    }

    async register(registerInfo) {
        this.persistentClient = new Client({
            host : this.host,
            port : this.port,
            schemaDir: `${__dirname}/../schema`,
            mode: "persistent"
        })
        await this.persistentClient.call("register", registerInfo);
    }

    async lookup(name) {
        let instantClient = new Client({
            host : this.host,
            port : this.port,
            schemaDir: `${__dirname}/../schema`,
            mode: "instant"
        })
        return await instantClient.call("lookup", name);
    }
};