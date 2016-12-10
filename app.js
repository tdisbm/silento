'use strict';

const config = require('./config/parameters.json');
const http_bundle = require('./src/http/loader.js')(config);
  