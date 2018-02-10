const hash = service => `${service.host}:${service.port}`;

const services = new Map();
const deactivated = new Map();

module.exports = {
    add(name, service) {
        if (!services.has(name)) {
            services.set(name, new Map());
        }

        services.get(name).set(hash(service), service);
    },

    remove(name, service) {
        if (services.has(name)) {
            services.get(name).delete(hash(service));
        }
    },

    list() {
        let serviceList = [];
        services.forEach((instances, name) => {
            let instanceList = [];
            instances.forEach((service) => {
                instanceList.push({
                    host: service.host,
                    port: service.port,
                    activated: deactivated.has(name) ? !deactivated.get(name).has(hash(service)) : true
                });
            });
            serviceList.push({
                name: name,
                services: instanceList
            });
        });
        return serviceList;
    },
    
    activate(name, service) {
        if (deactivated.has(name)) {
            deactivated.get(name).delete(hash(service));
        }
    },

    deactivate(name, service) {
        if (!deactivated.has(name)) {
            deactivated.set(name, new Set());
        }

        deactivated.get(name).add(hash(service));
    },

    retrieveActivated(name) {
        if (!services.has(name)) {
            return [];
        }

        let all = [...services.get(name).values()];
        if(!deactivated.has(name)) {
            return all;
        }

        return all.filter(service => !deactivated.get(name).has(hash(service)));
    },
};