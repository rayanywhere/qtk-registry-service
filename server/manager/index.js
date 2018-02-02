const name2subscribers = new Map();
const subscriber2name = new Map();

const publishers = new Map();

const services = new Map();

module.exports = class {
    static addPublisher(socket, name, shard) {
        publishers.set(socket, {name, shard});
    }

    static getPublisher(socket) {
        return publishers.get(socket);
    }

    static removePublisher(socket) {
        publishers.delete(socket);
    }

    static addService(name, shard, service) {
        if (!services.has(name)) {
            services.set(name, new Map());
        }

        services.get(name).set(shard, service);
    }

    static removeService(name, shard) {
        if (!services.has(name)) {
            return;
        }

        services.get(name).delete(shard);
    }

    static retrieveServices(name) {
        if (!services.has(name)) {
            return [];
        }
        const results = [];
        for (const [shard, service] of services.get(name).entries()) {
            results.push({shard, service});
        }
        return results;
    }

    static isSubscriber(socket) {
        return subscriber2name.has(socket);
    }

    static addSubscriber(name, socket) {
        if (!name2subscribers.has(name)) {
            name2subscribers.set(name, new Set());
        }
        name2subscribers.get(name).add(socket);

        subscriber2name.set(socket, name);
    }

    static removeSubscriber(socket) {
        if (!subscriber2name.has(socket)) {
            return;
        }
        const name = subscriber2name.get(socket);
        subscriber2name.delete(socket);

        if (!name2subscribers.has(name)) {
            return;
        }
        name2subscribers.get(name).delete(socket);
    }

    static retrieveSubscribers(name) {
        if (!name2subscribers.has(name)) {
            return [];
        }
        return name2subscribers.get(name);
    }
}