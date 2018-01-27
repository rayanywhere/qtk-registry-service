const Server = require('../server');
const PublisherClient = require('../client/publisher');
const SubscriberClient = require('../client/subscriber');
const assert = require('assert');
const host = "127.0.0.1";
const port = 10000;

describe('#register-service', function() {
    before(function() {
        let server = new Server({host, port});
        server.start();
    })

    describe("testing normal publish/subscribe flow", function() {
        it("should return without error", function(done) {
            const publisherClient = new PublisherClient({host, port});
            const subscriberClient = new SubscriberClient({host, port});
            publisherClient.publish('Test.Service', {
                shard: 0,
                host: 'localhost',
                port: 8231
            });

            setTimeout(() => {
                subscriberClient.on('update', (services) => {
                    assert((services.length === 1) && (services[0].port === 8231), "service info mismatch");
                    done();
                });
                subscriberClient.subscribe('Test.Service');
            }, 200);
        });
    });

    describe("testing non-existing service", function() {
        it("should return empty array", function(done) {
            const subscriberClient = new SubscriberClient({host, port});
            subscriberClient.on('update', (services) => {
                assert((services.length === 0), "service should be empty");
                done();
            });
            subscriberClient.subscribe('Test.Service1');
        });
    });

    describe("testing subscribe-first situation", function() {
        it("should return empty array followed by a non-empty services array", function(done) {
            const subscriberClient = new SubscriberClient({host, port});
            subscriberClient.on('update', (services) => {
                if ((services.length > 0) && (services[0].port === 8231)) {
                    done();
                }
            });
            subscriberClient.subscribe('Test.Service.Later');

            setTimeout(() => {
                const publisherClient = new PublisherClient({host, port});
                publisherClient.publish('Test.Service.Later', {
                    shard: 0,
                    host: 'localhost',
                    port: 8231
                });
            }, 1000);
        });
    });
});