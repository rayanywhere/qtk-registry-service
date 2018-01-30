const Server = require('@qtk/schema-tcp-framework').Server;
const log4js = require('log4js');
const path = require('path');
const manager = require('./manager');
const assert = require('assert');
const genuuid = require('uuid/v4');

module.exports = class  {
	constructor({host, port, logPath}) {
        log4js.configure({
            appenders: {
                runtime: logPath ? {
                    type: 'dateFile',
                    filename: `${logPath}/`,
                    pattern: "yyyy-MM-dd.log",
                    alwaysIncludePattern: true
                } : {
                    type: 'console'
                }
            },
            categories: {
                default: { appenders: ['runtime'], level: "ALL" }
            }
        });
        
        global.logger = log4js.getLogger();
        this._server = new Server({host: host, port: port});
        this._server.on("closed", (socket) => {
            if (manager.isSubscriber(socket)) {
                logger.info(`subscriber(${socket.remoteAddress}:${socket.remotePort}) disconnected`);
                manager.removeSubscriber(socket);
            }
        });
        this._server.on("exception", (socket, error) => {
            logger.error(`exception occurred at client(${socket.remoteAddress}:${socket.remotePort}): ${error.stack}`);
        });
        this._server.on('data', (socket, {data: request}) => {
            switch(request.command) {
                case 'register':
                    this._handleRegister(request.name, request.shard, request.service);
                    break;
                case 'subscribe':
                    this._handleSubscribe(socket, request.name);
                    break;
                default:
                    throw new Error(`unknown command: ${request.command}`);
                    break;
            }
        });
    }

    start() {
        this._server.start();
    }

    _handleRegister(name, shard, service) {
        assert(typeof name === 'string', '[name] is expected to be a string');
        assert(shard !== undefined, '[shard] is missing');
        assert(typeof service === 'object', '[service] is expected to be an object with form of {shard, host, port}');
        assert(Number.isInteger(service.port), '[service.port] is expected to be an integer');
        assert(typeof service.host === 'string', '[service.host] is expected to be a string');
        manager.addService(name, shard, service);
        for(const socket of manager.retrieveSubscribers(name)) {
            this._notify(socket, name);
        }
        logger.info(`shard(${shard})@${service.host}:${service.port} under name(${name}) registered`);
    }

    _handleSubscribe(socket, name) {
        manager.addSubscriber(name, socket);
        this._notify(socket, name);
        logger.info(`subscriber(${socket.remoteAddress}:${socket.remotePort}) connected`);
    }

    _notify(socket, name) {
        const services = manager.retrieveServices(name);
        this._server.send(socket, {uuid: genuuid().replace(/-/g, ''), data: services});
    }
};
