import router from './socket/routes.js'
import SocketTokenValidator from './../library/middlewares/socket-token-validator.js';

let nsp;

let onlineUsers = {};

export default {
  setWebSocket(ioObj) {
    if (typeof ioObj !== 'object') {
      throw new Error('Socket.io object is required.');
    }

    nsp = ioObj.of('/user');
    nsp.use(SocketTokenValidator);
    nsp.on('connection', this.handle.bind(this));
    nsp.on('error', console.log);

  },
  handle(socket) {
    router.routes(socket, nsp);

    if(socket.request.user) {
      const userId = socket.request.user.id;
      const s = onlineUsers[userId];
      if(!s) {
        onlineUsers[userId] = 1;
      } else {
        onlineUsers[userId] = s+1;
      }
      nsp.emit('clientCount', Object.keys(onlineUsers).length);

      socket.on('disconnect', () => {
        const s = onlineUsers[userId];
        if(s <=1) {
          delete onlineUsers[userId]
        } else {
          onlineUsers[userId] = s - 1;
        }
        nsp.emit('clientCount', Object.keys(onlineUsers).length);
      });
    }
    socket.emit('clientCount', Object.keys(onlineUsers).length);
  }
};