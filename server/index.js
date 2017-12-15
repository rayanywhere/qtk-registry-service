const Server = require('@qtk/schema-tcp-request-framework').Server;
const log4js = require('log4js');
const path = require('path');
const Cache = require('./lib/cache');

module.exports = class  {
	constructor({host, port, timeout, log}) {
        log4js.configure({
            appenders: {
                runtime: {
                    type: 'dateFile',
                    filename: `${log}/`,
                    pattern: "yyyy-MM-dd.log",
                    alwaysIncludePattern: true
                }
            },
            categories: {
                default: { appenders: ['runtime'], level: "ALL" },
                runtime: { appenders: ['runtime'], level: "ALL" }
            }
        });
        global.logger = log4js.getLogger('runtime');
        global.cache = new Cache();

        this.server = new Server({
            host: host,
            port: port,
            handlerDir: `${__dirname}/handler`,
            schemaDir: `${__dirname}/../schema`
        }, []);

        this.server.on("started", () => {
            logger.info(`server started at ${host}:${port}`);
        });
        
        this.server.on("stopped", () => {
            logger.info(`server stopped at ${host}:${port}`);
        });

        this.server.on("connected", (socket) => {
            logger.info(`client(${socket.remoteAddress}:${socket.remotePort}) connected`);
        });

        this.server.on("closed", (socket) => {
            logger.info(`client(${socket.remoteAddress}:${socket.remotePort}) closed`);
            cache.deleteBySocket(socket);
        });

        this.server.on("error", (error, socket) => {
            logger.info(`error occurred at client(${socket.remoteAddress}:${socket.remotePort}): ${error.stack}`);
        });
    }

    start() {
        this.server.start();
    }
};
