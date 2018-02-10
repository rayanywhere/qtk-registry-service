const publishers = new Map();

module.exports = {
    add(socket, name) {
        publishers.set(socket, name);
    },

    get(socket) {
        return publishers.get(socket);
    },

    remove(socket) {
        publishers.delete(socket);
    },
};