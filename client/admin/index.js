const Client = require('@qtk/tcp-request-framework').Client;
const genuuid = require('uuid/v4');
const assert = require('assert');

module.exports = class {
    constructor({host, port}) {
        this._client = new Client({host, port});
    }

    async enable(name, service) {
        assert(typeof service.host === 'string', 'expect service.host to be a string');
        assert(Number.isInteger(service.port), 'expect service.port to be an integer');
        await this._client.send({
            payload: Buffer.from(JSON.stringify({
                command: 'admin_enable',
                name,
                service
            }), 'utf8')
        });
    }

    async disable(name, service) {
        assert(typeof service.host === 'string', 'expect service.host to be a string');
        assert(Number.isInteger(service.port), 'expect service.port to be an integer');
        await this._client.send({
            payload: Buffer.from(JSON.stringify({
                command: 'admin_disable',
                name,
                service
            }), 'utf8')
        });
    }

    async listEntries() {
        const response = await this._client.send({
            payload: Buffer.from(JSON.stringify({
                command: 'admin_list_entries'
            }), 'utf8')
        });
        return JSON.parse(response.toString('utf8'));
    }

    async listServices(name) {
        const response = await this._client.send({
            payload: Buffer.from(JSON.stringify({
                command: 'admin_list_services',
                name,
            }))
        });
        return JSON.parse(response.toString('utf8'));
    }
};