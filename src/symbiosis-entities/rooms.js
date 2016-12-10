'use strict';

const Feedback = require('../../node_modules/symbiosis/lib/middleware/elements/Feedback');
const util = require('util');
const _ = require('lodash');

let rooms = {};

const sources = {
  room_list : () => {
    return rooms;
  },
  room_name_list : (socket, data) => {
    const from = _.get(data, "from", 0);
    const to = _.get(data, "to", _.size(rooms));
    const room_keys = Object.keys(rooms);

    let room_names = [];

    for (let i = from; i < to; i++) {
      room_names.push(room_keys[i]);
    }
    
    return room_names;
  }
};

const events = {
  room_create: (socket, data) => {
    const room_name = _.get(data, 'room_name', null);

    let message = util.format('Room %s is created', room_name);
    let status = Feedback.FEEDBACK_STATUS_SUCCESS;

    switch (true) {
      case null === room_name:
        message = 'Room name is null';
        status = Feedback.FEEDBACK_STATUS_MALFORMATED;
        break;
      case _.get(rooms, room_name, null) !== null:
        message = util.format('Room %s already exists', room_name);
        status = Feedback.FEEDBACK_STATUS_FAILURE;
        break;
      default:
        const username = _.get(socket, 'handshake.query.username', null);
        rooms[room_name] = {
          created_by : {
            socket_id: socket.id,
            username: username
          }
        };
        break;
      }

      if (room_name) {
        let user_rooms = _.get(socket, 'users_sources.data_heap[' + socket.id + '].rooms', []);
        let found = false;
        _.each(user_rooms, (room, user_room_name) => {
          if (user_room_name === room_name) found = true;
        });
        if (!found) {
          _.set(user_rooms, room_name, _.get(rooms, room_name, {}));
        }
        socket.join(room_name);
      }

      return new Feedback({
        message: message
      }, status);
  },
  room_remove: (socket, data) => {
    const room_name = _.get(data, 'room_name', null);
    let response = new Feedback({
      message: util.format('Room %s didn\'t exist', room_name)
    }, Feedback.FEEDBACK_STATUS_FAILURE);
    
    if (null === room_name) {
      response.setStatus(Feedback.FEEDBACK_STATUS_MALFORMATED).setData({
        message: 'Please provide room_name'
      });
    }
    
    if (rooms[room_name]) {
      delete rooms[room_name];
      response.setStatus(Feedback.FEEDBACK_STATUS_SUCCESS).setData({
        message: util.format('Successfully removed room %s', room_name)
      });
    }
    
    return response;
  },
  room_join: (socket, data) => {
    const room_name = _.get(data, 'room_name', null);
    let response = new Feedback({
      message: util.format('You can\'t join room %s', room_name)
    }, Feedback.FEEDBACK_STATUS_FAILURE);

    if (room_name && rooms[room_name]) {
      socket.join(room_name);
      response.setStatus(Feedback.FEEDBACK_STATUS_SUCCESS).setData({
        message: util.format('You joined %s', room_name)
      });
    }
    
    return response;
  },
  room_change: (socket, data) => {
    let room_name = _.get(data, 'room_name');
    let response = new Feedback();
    socket.join(room_name);

    response.setData({
      message: util.format('Joined %s', room_name)
    });

    return response;
  }
};

const lifecycles = {
  disconnect:  {
    room_destroy: (socket) => {
      _.each(rooms, (room, room_name) => {
        if (room.created_by.socket_id === socket.id) {
          delete rooms[room_name];
        }
      })
    }
  }
};

module.exports = {
    lifecycles: lifecycles,
    sources: sources,
    events: events
};