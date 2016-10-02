'use strict';

const feedback = require('../../feedback');
const helpers = require('../../helpers');
const util = require('util');
const _ = require('lodash');

const SOURCE_NAME = 'rooms';

let rooms = {};

const sources = {
  room_list : () => {
    return rooms;
  }
};

const events = {
  room_create: (socket, data) => {
    const room_name = _.get(data, 'room_name', null);

    let message = util.format('Room %s is created', room_name);
    let status = feedback.FEEDBACK_STATUS_SUCCESS;

    switch (true) {
      case null === room_name:
        message = 'Room name is null';
        status = feedback.FEEDBACK_STATUS_MALFORMATED;
        break;
      case _.get(rooms, room_name, null) !== null:
        message = util.format('Room %s already exists', room_name);
        status = feedback.FEEDBACK_STATUS_FAILURE;
        break;
      default:
        const username = _.get(helpers.query_get(socket), 'username', null);
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

      return {
        feedback: status,
        data: {
          message: message
        }
      }
  },
  room_remove: (socket, data) => {
    let room_name = _.get(data, 'room_name', null);
    let response = {
      feedback: feedback.FEEDBACK_STATUS_FAILURE,
      data: {
        message: util.format('Room %s didn\'t exist', room_name)
      }
    };
    
    if (null === room_name) {
      response.feedback = feedback.FEEDBACK_STATUS_MALFORMATED;
      response.data.message = 'Please provide room_name';
    }
    
    if (rooms[room_name]) {
      delete rooms[room_name];
      response.feedback = feedback.FEEDBACK_STATUS_SUCCESS;
      response.data.message = util.format('Successfully removed room %s', room_name);
    }
    
    return response;
  },
  room_join: (socket, data) => {
    const room_name = _.get(data, 'room_name', null);
    let response = {
      feedback: feedback.FEEDBACK_STATUS_FAILURE,
      data: {
        message: util.format('You can\'t join room %s', room_name)
      }
    };
    
    if (room_name && rooms[room_name]) {
      socket.join(room_name);
      response.feedback = feedback.FEEDBACK_STATUS_SUCCESS;
      response.data.message = util.format('You joined %s', room_name);
    }
    
    return response;
  },
  room_change: (socket, data) => {
    let room_name = _.get(data, 'room_name');
    socket.leave(socket.room);
    socket.join(room_name);
    
    return {
      feedback: feedback.FEEDBACK_STATUS_SUCCESS,
      data: {
        message: util.format('Changed to room %s', room_name)
      }
    }
  }
};

const lifecycles = {
  connect: () => {

  },
  disconnect: (socket) => {
    _.each(rooms, (room, room_name) => {
      if (room.created_by.socket_id === socket.id) {
        delete rooms[room_name];
      }
    })
  }
};

module.exports = (io) => {
  return require('../middleware/source_dispatcher')(io, {
    lifecycles: lifecycles,
    module_name: SOURCE_NAME,
    data_heap: rooms,
    sources: sources,
    events: events
  });
};