'use strict';

const _ = require('lodash');

module.exports = {
  query_get : function(socket) {
    return _.get(socket, 'handshake.query');
  }
};