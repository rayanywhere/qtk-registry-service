const Server = require('@qtk/schema-tcp-framework').Server;
const log4js = require('log4js');
const path = require('path');
const assert = require('assert');
const genuuid = require('uuid/v4');

const publishers = new Set();
const subscribers = new Set();
const blacklist = [];

module.exports = class {
	constructor({host, port, logPath}) {
        this._initLogger(logPath);
        this._initServer(host, port);
    }

    _initLogger(logPath) {
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
    }

    _initServer(host, port) {
        this._server = new Server({host, port});
        this._server.on("closed", (socket) => {
            switch(socket.peerType) {
                case 'subscriber':
                    this._onSubscriberClosed(socket);
                    break;
                case 'publisher':
                    this._onPublisherClosed(socket);
                    break;
                default:
                    break;
            }
        });
        this._server.on("exception", (socket, error) => {
            logger.error(`exception occurred at client(${socket.remoteAddress}:${socket.remotePort}): ${error.stack}`);
        });
        this._server.on('data', (socket, {uuid, data: request}) => {
            switch(request.command) {
                case 'publish':
                    this._handlePublish(socket, request.name, request.service);
                    break;
                case 'subscribe':
                    this._handleSubscribe(socket, request.name);
                    break;
                case 'admin_enable':
                    this._handleAdminEnable(uuid, socket, request.name, request.service);
                    break;
                case 'admin_disable':
                    this._handleAdminDisable(uuid, socket, request.name, request.service);
                    break;
                case 'admin_list_entries':
                    this._handleAdminListEntries(uuid, socket);
                    break;
                case 'admin_list_services':
                    this._handleAdminListServices(uuid, socket, request.name);
                    break;
                default:
                    throw new Error(`unknown command: ${request.command}`);
                    break;
            }
        });
    }

    _onSubscriberClosed(socket) {
        subscribers.delete(socket);
        const remaining = [...subscribers].filter(_ => _.data.name === socket.data.name).length;
        logger.info(`subscriber of service(${socket.data.name}) disconnected, remaining subscriber(s) = ${remaining}`);
    }

    _onPublisherClosed(socket) {
        publishers.delete(socket);
        const remaining = [...publishers].filter(_ => _.data.name === socket.data.name).length;
        logger.info(`publisher(${socket.data.service.host}:${socket.data.service.port}) of service(${socket.data.name}) disconnected, remaining publisher(s) = ${remaining}`);

        this._broadcast(socket.data.name);
    }

    _handlePublish(socket, name, service) {
        if (socket.peerType !== undefined) {
            throw new Error(`cannot issue command(publish) more than once`);
        }
        assert(typeof name === 'string', '[name] is expected to be a string');
        assert(typeof service === 'object', '[service] is expected to be an object with form of {shard, host, port}');
        assert(Number.isInteger(service.port), '[service.port] is expected to be an integer');
        assert(typeof service.host === 'string', '[service.host] is expected to be a string');
        socket.peerType = 'publisher';
        socket.data = {name, service};
        if (undefined !== [...publishers].find(_ => (_.data.name === name) 
            && (_.data.service.host === service.host)
            && (_.data.service.port === service.port))) {
            throw new Error(`duplicated service information under the name(${name})`);
        }

        publishers.add(socket);

        logger.info(`publisher(${service.host}:${service.port}) of service(${name}) connected`);
        this._notify(name);
    }

    _handleSubscribe(socket, name) {
        if (socket.peerType !== undefined) {
            throw new Error(`cannot issue command(subscribe) more than once`);
        }
        assert(typeof name === 'string', '[name] is expected to be a string');
        socket.peerType = 'subscriber';
        socket.data = {name};

        subscribers.add(socket);

        logger.info(`subscriber of service(${name}) connected`);
        this._notify(name, [socket]);
    }

    _handleAdminEnable(uuid, socket, name, service) {
        assert(typeof name === 'string', '[name] is expected to be a string');
        assert(typeof service === 'object', '[service] is expected to be an object with form of {shard, host, port}');
        assert(Number.isInteger(service.port), '[service.port] is expected to be an integer');
        assert(typeof service.host === 'string', '[service.host] is expected to be a string');

        const publisher = [...publishers].find(_ => (_.data.name === name) 
            && (_.data.service.host === service.host)
            && (_.data.service.port === service.port));
        
        if (publisher === undefined) {
            logger.error(`no publisher(${service.host}:${service.port}) found under the name(${name})`);
            return;
        }

        if (publisher.disabled === true) {
            publisher.disabled = false;
            logger.info(`publisher(${service.host}:${service.port}) of service(${name}) is enabled`);
            this._notify(name);
        }
        this._server.send(socket, {uuid, data: {}});
    }

    _handleAdminDisable(uuid, socket, name, service) {
        assert(typeof name === 'string', '[name] is expected to be a string');
        assert(typeof service === 'object', '[service] is expected to be an object with form of {shard, host, port}');
        assert(Number.isInteger(service.port), '[service.port] is expected to be an integer');
        assert(typeof service.host === 'string', '[service.host] is expected to be a string');

        const publisher = [...publishers].find(_ => (_.data.name === name) 
            && (_.data.service.host === service.host)
            && (_.data.service.port === service.port));

        if (publisher === undefined) {
            logger.error(`no publisher(${service.host}:${service.port}) found under the name(${name})`);
            return;
        }
        if (publisher.disabled !== true) {
            publisher.disabled = true;
            logger.info(`publisher(${service.host}:${service.port}) of service(${name}) is disabled`);
            this._notify(name);
        }
        this._server.send(socket, {uuid, data: {}});
    }

    _handleAdminListEntries(uuid, socket) {
        const entries = [...(new Set([...publishers].map(_ => _.data.name)))];
        this._server.send(socket, {uuid, data: entries});
    }

    _handleAdminListServices(uuid, socket, name) {
        assert(typeof name === 'string', '[name] is expected to be a string');

        const services = [...publishers].filter(_ => _.data.name === name).map(_ => ({
            host: _.data.service.host,
            port: _.data.service.port,
            disabled: _.disabled === true ? true:false
        }));
        this._server.send(socket, {uuid, data: services});
    }

    start() {
        this._server.start();
    }

    _notify(name, sockets = undefined) {
        if (sockets === undefined) {
            sockets = [...subscribers].filter(_ => _.data.name === name);
        }

        const services = [...publishers].filter(_ => (_.data.name === name) && (_.disabled !== true)).map(_ => _.data.service);
        for (const socket of sockets) {
            logger.info(`notifying service(${JSON.stringify(services)}) under the name(${name}) to subscriber ${socket.remoteAddress}:${socket.remotePort}`);
            this._server.send(socket, {uuid: genuuid().replace(/-/g, ''), data: services});
        }
    }
};