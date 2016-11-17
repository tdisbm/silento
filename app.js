'use strict';

const parameters = require('./config/parameters.json');
const app = require('express')();
const server = require('http').createServer(app);

let io = require('socket.io')(server);

io.on("connect", (socket) => {
	console.log("[+] " + socket.handshake.query.username + " connected to chat");
	socket.emit("hola", {hola : "hola"});
})

require('./data_sources/io/sources/rooms.js')(io);
require('./data_sources/io/sources/users.js')(io);

server.listen(parameters.io.port);
  