const Server = require('../server');
const Client = require('../client');
const assert = require('assert');
const childProcess = require('child_process');
const serverHost = "127.0.0.1";
const serverPort = 10000;

describe('#register-service', function() {
    let client = null;

    before(async() => {
        let server = new Server({
            host: serverHost,
            port: serverPort,
            log: __dirname + "/../logs",
            timeout: 30000
        })
        server.start();
        client = new Client(serverHost, serverPort);
    })

    describe("testing normal register / lookup flow", function() {
        it("should return without error", async function() {
            this.timeout(5000);
            await client.register({
                name: 'Test.Service',
                host: 'localhost',
                port: 8231,
                timeout: 10000
            });

            await sleep(200);

            let config = await client.lookup('Test.Service');
            assert(config.host === 'localhost' && config.port === 8231 && config.timeout === 10000, 'config mismatch');
        });
    });

    describe("testing missing lookup", function() {
        it("should return with error", async function() {
            try {
                await client.lookup('Test.Service.NotExists');
            }
            catch(err) {
                return;
            }
            assert(false, 'should throw error');
        });
    });
});

function sleep(millisecond) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            return resolve('');
        }, millisecond)
    })
}