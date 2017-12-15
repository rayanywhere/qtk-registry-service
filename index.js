const opts = require('opts');
const Server = require("./server");
opts.parse([
    {
        short: 'h',
        long: 'host',
        description: 'host to listen',
        value: true,
        required: true
    },
    {
        short: 'p',
        long: 'port',
        description: 'port to listen',
        value: true,
        required: true
    },
    {
        short: 't',
        long: 'timeout',
        description: 'maximum idle time of a connect client',
        value: true,
        required: false
    },
    {
        short: 'l',
        long: 'log',
        description: 'log directory',
        value: true,
        required: false
    }
], [], true);

let server = new Server({
    host: opts.get('host'),
    port:  parseInt(opts.get('port')),
    timeout: (opts.get('timeout') == undefined) ? 30000 : parseInt(opts.get('timeout')),
    log: (opts.get('log') === undefined) ? './logs/' : opts.get('log')
})
server.start();