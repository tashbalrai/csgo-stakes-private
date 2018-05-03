import express from 'express';
import router from './http/routes.js';
import socket from './socket.js';
import bodyParser from 'body-parser';
import path from 'path';

let app = express();
let io = null;

app.setWebSocket = function (ioObj) {
  if (typeof ioObj !== 'object') {
    throw new Error('Socket.io object is require.');
  }
  
  io = ioObj;
  socket.setWebSocket(io);
}

app.use(express.static(path.resolve(__dirname, './public')));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.use(router);


export default app;