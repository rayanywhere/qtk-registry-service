const name2subscribers = new Map();
const subscriber2name = new Map();

module.exports = {
    has(socket) {
        return subscriber2name.has(socket);
    },

    add(name, socket) {
        if (!name2subscribers.has(name)) {
            name2subscribers.set(name, new Set());
        }
        name2subscribers.get(name).add(socket);

        subscriber2name.set(socket, name);
    },

    remove(socket) {
        if (!subscriber2name.has(socket)) {
            return;
        }
        const name = subscriber2name.get(socket);
        subscriber2name.delete(socket);

        if (!name2subscribers.has(name)) {
            return;
        }
        name2subscribers.get(name).delete(socket);
    },

    retrieve(name) {
        if (!name2subscribers.has(name)) {
            return [];
        }
        return name2subscribers.get(name);
    }
};