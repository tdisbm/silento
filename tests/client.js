'use strict';

const io = require("socket.io-client");
const socket = io.connect("http://192.168.1.3:8000", {query: "username=" + process.argv[2]});

let stdin = process.openStdin();
let current_destination = null;
let current_event;

socket.on('message_to_room', (data) => {
  console.log(data.from + ':' + data.message);
}).on('message_to_user', (data) => {
  console.log(data.from + ':' + data.message);
});

stdin.addListener("data", function(input) {
  input = input.toString().trim();

  if (input[0] === '@') {
    const pieces = input.split(';');

    switch (true) {
      case pieces[0] == '@room_create':
        current_destination = pieces[1];
        socket.emit('room_create', {room_name: pieces[1]});
        break;
      case pieces[0] == '@room':
        current_event = 'message_to_room';
        current_destination = pieces[1];
        socket.emit('room_join', {room_name: pieces[1]});
        break;
      case pieces[0] == '@user':
        current_event = 'message_to_user';
        current_destination = pieces[1];
        break;
    }
  } else if (current_destination && current_event) {
    socket.emit(current_event, {
      to: current_destination,
      message: input
    })
  }
});







