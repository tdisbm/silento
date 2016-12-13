'use strict';

const Feedback = require('../../node_modules/symbiosis/lib/middleware/elements/Feedback');
const util = require('util');
const _ = require('lodash');

let users = {};

const sources = {
  user_list : () => {
    return users;
  },
  user_name_list : (socket, data) => {
    const users_length = _.size(users);
    const user_keys = Object.keys(users);
    let from = _.get(data, "from", 0);
    let to = _.get(data, "to", users_length);
    let user_names = [];

    if (to > users_length) {
      to = users_length;
    }

    if (from > users_length) {
      from = users_length - 1;
    }

    for (let i = from; i < to; i++) {
      user_names.push(users[user_keys[i]].username);
    }

    return user_names;
  }
};

const events = {
  user_disconnect: (socket, data, io) => {
    const username = _.get(data, 'username', null);
    let response = new Feedback();

    if (username) {
      let disconnected = false;
      _.each(users, (item) => {
        if (item.username === username) {
          io.sockets[item.socket_id].disconnect();
          disconnected = true;
        }
      });
      if (!disconnected) {
        response.setStatus(Feedback.FEEDBACK_STATUS_FAILURE);
      }
    } else {
      response.setStatus(Feedback.FEEDBACK_STATUS_FAILURE);
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
    const user_from = _.get(socket, 'handshake.query.username', null);
    const in_room = _.get(io, util.format('sockets.adapter.sids[%s][%s]', socket.id, room_name), false);
    
    if (room && message && in_room) {
      socket.broadcast.to(room_name).emit('message_to_room', {
        message: message,
        from: user_from
      });
    }
  }
};

const lifecycles = {
  connect: {
    user_create: (socket, io) => {
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

      socket.emit('connection.success');

      const user_name_list = _.get(io, 'symbiosis_user.sources.user_name_list');
      io.emit('user_name_list', user_name_list(socket, {}));
    }
  },
  disconnect: {
    user_destroy: (socket) => {
      delete users[socket.id];
    },
    update_user_name_list: (socket, io) => {
      const user_name_list = _.get(io, 'symbiosis_user.sources.user_name_list');
      io.emit('user_name_list', user_name_list(socket, {}));
    }
  }
};

module.exports = {
    lifecycles: lifecycles,
    sources: sources,
    events: events
};
