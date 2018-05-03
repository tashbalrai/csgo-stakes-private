import router from './socket/routes.js'

let clients = {}, nsp = null;

export default {
  setWebSocket(ioObj) {
    if (typeof ioObj !== 'object') {
      throw new Error('Socket.io object is required.');
    }
    nsp = ioObj.of('/admin');
    nsp.use((socket, next) => {
      if (socket.request.session 
      && socket.request.session.passport 
      && socket.request.session.passport.user) {
        let steamId = socket.request.session.passport.user.id;
        
        if (!clients.hasOwnProperty(steamId)) {
          clients[steamId] = socket.id;
        }
      }
      next();
    });
    nsp.on('connection', this.handle.bind(this));
    nsp.on('error', console.log);
  },
  handle(socket) {
    router.routes(socket);
  }
};