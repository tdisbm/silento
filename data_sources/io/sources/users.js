'use strict';

const feedback = require('../../feedback');
const helpers = require('../../helpers');
const util = require('util');
const _ = require('lodash');

const SOURCE_NAME = 'users';

let users = {};

const sources = {
  user_list : () => {
    return users;
  }
};

const events = {
  user_disconnect: (socket, data, io) => {
    const username = _.get(data, 'username', null);
    let response = {
      feedback: feedback.FEEDBACK_STATUS_SUCCESS
    };

    if (username) {
      let disconnected = false;
      _.each(users, (item) => {
        if (item.username === username) {
          io.sockets[item.socket_id].disconnect();
          disconnected = true;
        }
      });
      if (!disconnected) {
        response.feedback = feedback.FEEDBACK_STATUS_FAILURE
      }
    } else {
      response.feedback = feedback.FEEDBACK_STATUS_FAILURE
    }

    return response;
  },
  message_to_user: (socket, data, io) => {
    const message = _.get(data, 'message', null);
    const user_from = _.get(users, socket.id, null);
    const to = _.get(data, 'to', null);
    
    if (to && message && user_from) {
      _.each(users, (user, socket_id) => {
        if (user.username === to) {
          io.to(socket_id).emit('message_to_user', {
            message: message,
            from: user_from.username
          })
        }
      })
    }
  },
  message_to_room: (socket, data, io) => {
    const message = _.get(data, 'message', null);
    const room_name = _.get(data, 'to', null);
    const room = _.get(socket, util.format('rooms_sources.data_heap.%s', room_name), null);
    const user_from = helpers.query_get(socket);
    const in_room = _.get(io, util.format('sockets.adapter.sids[%s][%s]', socket.id, room_name), false);
    
    if (room && message && in_room) {
      socket.broadcast.to(room_name).emit('message_to_room', {
        message: message,
        from: user_from.username
      });
    }
  }
};

const lifecycles = {
  connect: (socket) => {
    const username = _.get(socket, 'handshake.query.username', null);
    if (null === username) {
      socket.emit('connection.failed', {
        message: 'Username is not provided'
      });
      socket.disconnect();
      return;
    }

    let in_use = false;
    _.each(users, function(user) {
      if (user.username.toLowerCase() === username.toLowerCase()) {
        in_use = true;
      }
    });
    
    if (in_use) {
      socket.emit('connection.failed', {
        message: 'Username is already in use'
      });
      socket.disconnect();
      return;
    }

    users[socket.id] = {
      username: username,
      id: socket.id
    };
  },
  disconnect: (socket) => {
    delete users[socket.id];
  }
};

module.exports = (io) => {
  return require('../middleware/source_dispatcher')(io, {
    lifecycles: lifecycles,
    module_name: SOURCE_NAME,
    data_heap: users,
    sources: sources,
    events: events
  });
};
