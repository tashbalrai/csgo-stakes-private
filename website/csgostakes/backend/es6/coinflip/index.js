import express from 'express';
import bodyParser from 'body-parser';
import router from './http/routes.js';

let app = express();
let io = null;

app.setWebSocket = function (ioObj) {
  if (typeof ioObj !== 'object') {
    throw new Error('Socket.io object is require.');
  }

  io = ioObj;
  socket.setWebSocket(io);
};

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.use(router);


export default app;