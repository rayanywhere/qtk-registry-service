const Server = require('../server');
const PublisherClient = require('../client/publisher');
const SubscriberClient = require('../client/subscriber');
const AdminClient = require('../client/admin');
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

    describe("testing admin functionalities", function() {
        const adminClient = new AdminClient({host, port});
        it("should return all entries.", async function() {
            const entries = await adminClient.listEntries();
            assert(entries.length == 2, `expect 2 entries returned`);
        });

        it("should return all services", async function() {
            const services = await adminClient.listServices('Test.Service.Later');
            assert(services.length == 1, `expect 1 service returned`);
        });

        it("should return correct number of services", async function() {
            let services = await adminClient.listServices('Test.Service.Later');
            assert(services.filter(_ => _.disabled === true).length  == 0, `expect 0 disabled service returned`);
            await adminClient.disable('Test.Service.Later', {host:'localhost', port:8231});
            services = await adminClient.listServices('Test.Service.Later');
            assert(services.filter(_ => _.disabled === true).length == 1, `expect 1 disabled service returned`);
            await adminClient.enable('Test.Service.Later', {host:'localhost', port:8231});
            services = await adminClient.listServices('Test.Service.Later');
            assert(services.filter(_ => _.disabled === true).length == 0, `expect 0 disabled service returned`);
        });
    });
});
