const Client = require('@qtk/schema-tcp-framework').Client;
const EventEmitter = require('events').EventEmitter;
const genuuid = require('uuid/v4');

module.exports = class extends EventEmitter {
    constructor({host, port}) {
        super();
        this._host = host;
        this._port = port;
        this._client = undefined;
    }

    publish(name, {shard, host, port}) {
        if (this._client !== undefined) {
            throw new Error('cannot call publish function more than once');
        }
        this._client = new Client({host: this._host, port: this._port});
        this._client.on('connected', () => {
            this._client.send({uuid: genuuid().replace(/-/g, ''), data: {
                command: 'publish',
                name,
                service: {shard, host, port}
            }});
        });
    }
};