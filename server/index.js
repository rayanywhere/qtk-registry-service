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
            if (manager.isPublisher(socket)) {
                logger.info(`publisher(${socket.remoteAddress}:${socket.remotePort}) disconnected`);
                const name = manager.getNameByPublisher(socket);
                assert(name !== undefined, 'name should not be empty');
                manager.removePublisher(socket);
                this._notify(name);
            }
            else if (manager.isSubscriber(socket)) {
                logger.info(`subscriber(${socket.remoteAddress}:${socket.remotePort}) disconnected`);
                manager.removeSubscriber(socket);
            }
        });
        this._server.on("exception", (socket, error) => {
            logger.error(`exception occurred at client(${socket.remoteAddress}:${socket.remotePort}): ${error.stack}`);
        });
        this._server.on('data', (socket, {data: request}) => {
            switch(request.command) {
                case 'publish':
                    this._handlePublish(socket, request.name, request.service);
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

    _handlePublish(socket, name, service) {
        assert(typeof name === 'string', '[name] is expected to be a string');
        assert(typeof service === 'object', '[service] is expected to be an object with form of {shard, host, port, timeout}');
        assert(Number.isInteger(service.shard), '[shard] is expected to be an integer');
        assert(Number.isInteger(service.timeout), '[timeout] is expected to be an integer');
        assert(Number.isInteger(service.port), '[port] is expected to be an integer');
        assert(typeof service.host === 'string', '[host] is expected to be a string');
        logger.info(`publisher(${socket.remoteAddress}:${socket.remotePort}) engaged`);
        manager.addPublisher(name, {socket, service});
        this._notify(name);
    }

    _handleSubscribe(socket, name) {
        assert(typeof name === 'string', '[name] is expected to be a string');
        logger.info(`subscriber(${socket.remoteAddress}:${socket.remotePort}) engaged`);
        manager.addSubscriber(name, socket);
        const services = manager.getServicesByName(name);
        this._server.send(socket, {uuid: genuuid().replace(/-/g, ''), data: services});
    }

    _notify(name) {
        const services = manager.getServicesByName(name);
        for (const subscriber of manager.getSubscribersByName(name)) {
            this._server.send(subscriber, {uuid: genuuid().replace(/-/g, ''), data: services});
        }
    }
};
