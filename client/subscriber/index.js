const Client = require('@qtk/schema-tcp-framework').Client;
const EventEmitter = require('events').EventEmitter;
const genuuid = require('uuid/v4');

/**
 * event: 'update' => (services)
 */
module.exports = class extends EventEmitter {
    constructor({host, port, name}) {
        super();
        const client = new Client({host, port});
        client.on('connected', () => {
            client.send({uuid: genuuid().replace(/-/g, ''), data: {
                command: 'subscribe',
                name
            }});
        });
        client.on('data', ({data: services}) => {
            this.emit('update', services);
        });
    }
};