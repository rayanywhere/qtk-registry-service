const Client = require('@qtk/schema-tcp-framework').Client;
const genuuid = require('uuid/v4');
const Awaitor = require('awaitor');

module.exports = class {
    constructor({host, port}) {
        this._awaitor = new Awaitor();
        this._client = new Client({host, port});
        this._consuming = false;
        this._pendingListCmd = [];
        this._client.on('exception', (err) => console.log(err));
    }

    activate(name, service) {
        this._client.send({
            uuid: genuuid().replace(/-/g, ''), 
            data: {
                command: 'activate',
                name,
                service
            }
        });
    }

    deactivate(name, service) {
        this._client.send({
            uuid: genuuid().replace(/-/g, ''), 
            data: {
                command: 'deactivate',
                name,
                service
            }
        });
    }

    list() {
        let uuid = genuuid().replace(/-/g, '');
        this._pendingListCmd.push(uuid);
        if(this._consuming == false) {
            this._consumeListCmd();
        }
        return this._awaitor.wait(uuid);
    }

    async _consumeListCmd() {
        this._consuming = true;
        try {
            while(this._pendingListCmd.length > 0) {
                let uuid = this._pendingListCmd.shift();
                this._client.send({uuid, data: {command: 'list'}});
                this._client.on('data', ({data}) => {
                    if(Array.isArray(data)) {
                        this._awaitor.resolve(uuid, data);
                    }
                });
                setTimeout(() => {
                    this._awaitor.reject(uuid, new Error('command [list] timeout'))
                }, 3000);
                await this._awaitor.wait(uuid);
            }
        }
        catch(err) {
            console.error(err);
        }
        this._consuming = false;
    }

};