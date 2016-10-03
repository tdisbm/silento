'use strict';

const _ = require('lodash');
const EVENT_CONNECTION = 'connection';
const EVENT_DISCONNECT = 'disconnect';
const MODULE_POSTFIX = '_sources';

module.exports = (io, bindable) => {
  const sources = _.get(bindable, 'sources', {});
  const events = _.get(bindable, 'events', {});
  
  const module_name = _.get(bindable, 'module_name', null);
  const data_heap = _.get(bindable, 'data_heap', null);
  
  const lifecycles = _.get(bindable, 'lifecycles', {});
  const lifecycles_connect = _.get(lifecycles, 'connect', {});
  const lifecycles_disconnect = _.get(lifecycles, 'disconnect', {});

  if (_.isNull(module_name)) {
    return;
  }

  io.on(EVENT_CONNECTION, (socket) => {
    _.isFunction(lifecycles_connect)
      ? lifecycles_connect(socket)
      : _.each(lifecycles_connect, (lifecycle) => lifecycle(socket));

      _.each(sources, (source, source_id) => {
        socket.on(source_id, (data) => socket.emit(source_id, source(socket, data)));
      });

      _.each(events, (event, event_id) => {
        socket.on(event_id, (data) => {
          const response = event(socket, data, io);
          const response_feedback = _.get(response, 'feedback', null);
          const response_data = _.get(response, 'data', null);
          if (response_feedback) {
            socket.emit(event_id + '.' + response_feedback, response_data);
          }
        });
      });

      socket.on(EVENT_DISCONNECT, () => {
        _.isFunction(lifecycles_disconnect)
          ? lifecycles_disconnect(socket)
          : _.each(lifecycles_disconnect, (lifecycle) => lifecycle(socket));
      });

      _.set(socket, module_name + MODULE_POSTFIX, {
        lifecycles: lifecycles,
        data_heap: data_heap,
        sources: sources,
        events: events
      });
  })
};