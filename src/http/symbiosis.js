const symbiosis = require("symbiosis")("config/maps/symbiosis_entities.json");
const _ = require('lodash');

module.exports = function(config) {
    const port = _.get(config, 'io.port', null);
    const io = symbiosis.io.listen(port);

    io.on('connect', function(socket) {
        const headers = socket.handshake.headers;
        
        console.info('[+] NEW CONNECTION: \n - Host: %s \n - User Agent: %s \n - Username: %s',
            headers['host'],
            headers['user-agent'],
            _.get(socket, 'handshake.query.username', null)
        );

        socket.on("disconnect", function() {
            console.info('[-] DISCONNECTED: \n - Host: %s \n - User Agent: %s \n - Username: %s',
                headers['host'],
                headers['user-agent'],
                _.get(socket, 'handshake.query.username', null)
            );
        })
    });
    
    return symbiosis;
};