
import fs from 'fs';
let config = {};

if (typeof process.env.NODE_DEV_MODE == 'undefined') {
  config = require('./config-prod.js').default;
} else {
  let confFile = `${__dirname}/config-${process.env.NODE_DEV_MODE}.js`;
  if (fs.existsSync(confFile)) {
    config = require(confFile).default;
  } else {
    config = require('./config-test.js').default;
  }
}

export default config;