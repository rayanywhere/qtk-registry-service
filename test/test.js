const Server = require('../server');
const PublisherClient = require('../client/publisher');
const SubscriberClient = require('../client/subscriber');
const assert = require('assert');
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
                    assert((services.length === 1) && (services[0].service.port === 8231), "service info mismatch");
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
                if ((services.length > 0) && (services[0].service.port === 8231)) {
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
});
