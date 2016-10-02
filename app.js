'use strict';

const server = require('http').createServer();
const parameters = require('./config/parameters.json');

let io = require('socket.io')(server);

require('./data_sources/io/sources/rooms.js')(io);
require('./data_sources/io/sources/users.js')(io);

server.listen(parameters.io.port);