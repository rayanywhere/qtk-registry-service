const Server = require('../server');
const PublisherClient = require('../client/publisher');
const SubscriberClient = require('../client/subscriber');
const ManagerClient = require('../client/manager');
const assert = require('assert');
const sleep = sec => new Promise(r => setTimeout(r, sec * 1000));
const host = "127.0.0.1";
const port = 30000;

describe('#register-service', function() {
    before(function() {
        let server = new Server({host, port});
        server.start();
    })

    describe("testing normal publish/subscribe flow", function() {
        it("should return without error", function(done) {
            const name = 'Test.Service';
            const shard = 'abc';
            new PublisherClient({host, port, name, shard, service: {
                host: 'localhost',
                port: 8231
            }});

            setTimeout(() => {
                const subscriberClient = new SubscriberClient({host, port, name});
                subscriberClient.on('update', (services) => {
                    console.log(services);
                    assert((services.length === 1) && (services[0].port === 8231), "service info mismatch");
                    subscriberClient.removeAllListeners('update');
                    done();
                });
            }, 200);
        });
    });

    describe("testing non-existing service", function() {
        it("should return empty array", function(done) {
            const name = 'Test.Service1';
            const subscriberClient = new SubscriberClient({host, port, name});
            subscriberClient.on('update', (services) => {
                assert((services.length === 0), "service should be empty");
                subscriberClient.removeAllListeners('update');
                done();
            });
        });
    });

    describe("testing subscribe-first situation", function() {
        it("should return empty array followed by a non-empty services array", function(done) {
            const name = 'Test.Service.Later';
            const shard = 'abc';
            const subscriberClient = new SubscriberClient({host, port, name});
            subscriberClient.on('update', (services) => {
                if ((services.length > 0) && (services[0].port === 8231)) {
                    subscriberClient.removeAllListeners('update');
                    done();
                }
            });

            setTimeout(() => {
                new PublisherClient({host, port, name, shard, service: {
                    host: 'localhost',
                    port: 8231
                }});
            }, 1000);
        });
    });

    describe("testing management", function() {
        let manager = new ManagerClient({host, port});
        it("should list all service in time.", async function() {
            let list = await manager.list();
            assert(list.length == 2, `expect 2 services returned in list command`);
        });

        it("should deactive a service", async function() {
            let name = "Test.Service.Later";
            let host = "localhost";
            let port = 8231;
            manager.deactivate(name, {host: "localhost", port: 8231});
            sleep(1);
            let list = await manager.list();
            let target = list.filter(item => item.name === name)[0];
            targetService = target.services.filter(item => item.host === host && item.port === port)[0];
            assert(targetService && targetService.activated === false, `expect service to be successfully deactivated.`);
        });

        it("should active a service", async function() {
            let name = "Test.Service.Later";
            let host = "localhost";
            let port = 8231;
            manager.activate(name, {host: "localhost", port: 8231});
            sleep(1);
            let list = await manager.list();
            let target = list.filter(item => item.name === name)[0];
            targetService = target.services.filter(item => item.host === host && item.port === port)[0];
            assert(targetService && targetService.activated === true, `expect service to be successfully deactivated.`);
        });
    });
});
