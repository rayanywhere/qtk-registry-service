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
            if (manager.subscriber.has(socket)) {
                logger.info(`subscriber(${socket.remoteAddress}:${socket.remotePort}) disconnected`);
                manager.subscriber.remove(socket);
            }
            else {
                logger.info(`publisher(${socket.remoteAddress}:${socket.remotePort}) disconnected`);
                const publisherInfo = manager.publisher.get(socket);
                if (publisherInfo !== undefined) {
                    manager.publisher.remove(socket);
                    manager.service.remove(publisherInfo.name, publisherInfo.shard);
                    for(const socket of manager.subscriber.retrieve(publisherInfo.name)) {
                        this._notify(socket, publisherInfo.name);
                    }
                }
            }
        });
        this._server.on("exception", (socket, error) => {
            logger.error(`exception occurred at client(${socket.remoteAddress}:${socket.remotePort}): ${error.stack}`);
        });
        this._server.on('data', (socket, {data: request}) => {
            switch(request.command) {
                case 'register':
                    this._handleRegister(socket, request.name, request.service);
                    break;
                case 'subscribe':
                    this._handleSubscribe(socket, request.name);
                    break;
                case 'activate':
                    this._handleActivate(socket, request.name, request.service);
                    break;
                case 'deactivate':
                    this._handleDeactivate(socket, request.name, request.service);
                    break;
                case 'list':
                    this._handleList(socket);
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

    _handleRegister(socket, name, service) {
        assert(typeof name === 'string', '[name] is expected to be a string');
        assert(typeof service === 'object', '[service] is expected to be an object with form of {shard, host, port}');
        assert(Number.isInteger(service.port), '[service.port] is expected to be an integer');
        assert(typeof service.host === 'string', '[service.host] is expected to be a string');
        manager.publisher.add(socket, name);
        manager.service.add(name, service);
        for(const socket of manager.subscriber.retrieve(name)) {
            this._notify(socket, name);
        }
        logger.info(`service ${service.host}:${service.port} under name(${name}) registered`);
    }

    _handleSubscribe(socket, name) {
        manager.subscriber.add(name, socket);
        this._notify(socket, name);
        logger.info(`subscriber(${socket.remoteAddress}:${socket.remotePort}) connected`);
    }

    _handleActivate(socket, name, service) {
        assert(typeof name === 'string', '[name] is expected to be a string');
        assert(typeof service === 'object', '[service] is expected to be an object with form of {shard, host, port}');
        assert(Number.isInteger(service.port), '[service.port] is expected to be an integer');
        assert(typeof service.host === 'string', '[service.host] is expected to be a string');
        manager.service.activate(name, service);
        for(const socket of manager.subscriber.retrieve(name)) {
            this._notify(socket, name);
        }
        logger.info(`service ${service.host}:${service.port} under name(${name}) activated`);
    }

    _handleDeactivate(socket, name, service) {
        assert(typeof name === 'string', '[name] is expected to be a string');
        assert(typeof service === 'object', '[service] is expected to be an object with form of {shard, host, port}');
        assert(Number.isInteger(service.port), '[service.port] is expected to be an integer');
        assert(typeof service.host === 'string', '[service.host] is expected to be a string');
        manager.service.deactivate(name, service);
        for(const socket of manager.subscriber.retrieve(name)) {
            this._notify(socket, name);
        }
        logger.info(`service ${service.host}:${service.port} under name(${name}) deactivated`);
    }

    _handleList(socket) {
        let list = manager.service.list();
        this._server.send(socket, {uuid: genuuid().replace(/-/g, ''), data: list});
    }

    _notify(socket, name) {
        const services = manager.service.retrieveActivated(name);
        logger.info(`pushing service(${JSON.stringify(services)}) under the name(${name}) to subscriber ${socket.remoteAddress}:${socket.remotePort}`);
        this._server.send(socket, {uuid: genuuid().replace(/-/g, ''), data: services});
    }
};
