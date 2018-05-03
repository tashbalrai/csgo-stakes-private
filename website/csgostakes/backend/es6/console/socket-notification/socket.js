import SocketTokenValidator from './../../library/middlewares/socket-token-validator.js';
import Redis from 'redis';
import config from './../../config/config';

let 
    nsp = null,
    clients = {},
    sub = null;

const notifier = {
  setWebSocket(ioObj) {
    if (typeof ioObj !== 'object') {
      throw new Error('Socket.io object is required.');
    }

    nsp = ioObj.of('/bn');
    nsp.use(SocketTokenValidator);
    nsp.on('connection', this.connection.bind(this));
    nsp.on('error', console.log);

    sub = Redis.createClient(config.redis)
    // Redis subscriber code.
    sub.on('ready', () => {
      sub.subscribe('notifier.message');
    })
    

    sub.on('subscribe', (channel, count) => {
      console.log('Subscibed to channel %s, count %s', channel, count);
      this.initNotifier();
    });
  },

  connection(socket) {
    if (socket.request.user && typeof clients[socket.request.user.id] == 'undefined') {
      clients[socket.request.user.id] = socket.id;
    }

    console.log('connected: ', clients);
    socket.on('disconnect', () => {
      if (socket.request.user && typeof clients[socket.request.user.id] != 'undefined') {
        delete clients[socket.request.user.id];
        console.log('disconnected...');
      }
    });
  },

  initNotifier() {
    sub.on('message', (channel, message) => {
      let msg = JSON.parse(message);

      if (!msg.event || !msg.data) {
        return;
      }

      if (typeof clients[msg.data.userId] != 'undefined') {
        nsp.to(clients[msg.data.userId]).emit(msg.event, msg);
      } else if (msg.event == 'broadcast') {
        if (msg.subEvent) {
          console.log('Emitting event: ', msg.subEvent);
          nsp.emit(msg.subEvent, msg);
        } else {
          nsp.emit('broadcast', msg);
        }
      }
    });
  }
};

export default notifier;