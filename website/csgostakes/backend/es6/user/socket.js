import router from './socket/routes.js';
import config from './config/config.js';
import Redis from 'redis';
import SocketTokenValidator from './../library/middlewares/socket-token-validator.js';

let nsp;

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
      this.userCounter(userId, true);

      socket.on('disconnect', () => {
        this.userCounter(userId, false);
      });
    } else {
      this.userCounter(null, false);
    }
  },
  
  userCounter(userId, connected) {

    let 
      redis = Redis.createClient(config.redis),
      fakeCounter = 30;
    redis.on('ready', () => {
      redis.get('online.users', (err, rawOnlineUsers) => {
        let onlineUsers = {};
        
        if (err) {
          redis.quit();
          nsp.emit('clientCount', fakeCounter);
          console.log('userCounter: ', err);
          return;
        }

        try {
          onlineUsers = JSON.parse(rawOnlineUsers);
          if (!onlineUsers) {
            onlineUsers = {};
          }
        } catch (e) {
          console.log(e);
          nsp.emit('clientCount', fakeCounter);
          return;
        }

        if (connected && userId && !onlineUsers[userId]) {
          onlineUsers[userId] = 1;
        } else if (!connected && onlineUsers[userId]) {
          delete onlineUsers[userId];
        }

        nsp.emit('clientCount', Object.keys(onlineUsers).length + fakeCounter);

        redis.set('online.users', JSON.stringify(onlineUsers), (err, result) => {
          redis.quit();
        });
      });
    });
  }

};