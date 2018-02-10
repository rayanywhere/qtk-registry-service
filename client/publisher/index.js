const Client = require('@qtk/schema-tcp-framework').Client;
const genuuid = require('uuid/v4');
const assert = require('assert');

module.exports = class {
    constructor({host, port, name, service}) {
        const client = new Client({host, port});
        assert(typeof service.host === 'string', 'service.host is expected to be a string');
        assert(Number.isInteger(service.port), 'service.port is expected to be an integer');
        client.on('connected', () => {
            client.send({uuid: genuuid().replace(/-/g, ''), data: {
                command: 'register',
                name,
                service
            }});
        });
    }
};