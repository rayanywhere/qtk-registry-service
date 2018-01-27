const name2publishers = new Map();
const publisher2name = new Map();

const name2subscribers = new Map();
const subscriber2name = new Map();

module.exports = class {
    static addPublisher(name, {socket, service}) {
        if (!name2publishers.has(name)) {
            name2publishers.set(name, new Map());
        }
        name2publishers.get(name).set(socket, service);
        publisher2name.set(socket, name);
    }

    static removePublisher(socket) {
        if (!publisher2name.has(socket)) {
            return;
        }
        const name = publisher2name.get(socket);
        publisher2name.delete(socket);

        if (!name2publishers.has(name)) {
            return;
        }
        name2publishers.get(name).delete(socket);
    }

    static isPublisher(socket) {
        return publisher2name.has(socket);
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

    static getSubscribersByName(name) {
        if (!name2subscribers.has(name)) {
            return [];
        }
        return name2subscribers.get(name);
    }

    static isSubscriber(socket) {
        return subscriber2name.has(socket);
    }

    static getNameByPublisher(socket) {
        return publisher2name.get(socket);
    }

    static getServicesByName(name) {
        const publishers = name2publishers.get(name);
        if (publishers === undefined) {
            return [];
        }
        return [...publishers.values()];
    }
}