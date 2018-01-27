const Client = require('@qtk/schema-tcp-framework').Client;
const genuuid = require('uuid/v4');

module.exports = class {
    constructor({host, port}) {
        this._client = new Client({host, port});
    }

    register(name, shard, {host, port}) {
        this._client.send({uuid: genuuid().replace(/-/g, ''), data: {
            command: 'register', name, shard, service: {host, port}
        }});
    }

    unregister(name, shard) {
        this._client.send({uuid: genuuid().replace(/-/g, ''), data: {
            command: 'unregister', name, shard
        }});
    }
};