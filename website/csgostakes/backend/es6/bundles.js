import Admin from './admin/index.js';
import SteamLoginByPass from './steam-login-bypass/index.js';
import User from './user/index.js';
import Test from './test/index.js';
import React from './react/index.js';
import SocketNotification from './console/socket-notification/socket.js';
import Ticket from './ticket/index.js';
import Coinflip from './coinflip/index.js';
import Giveaway from './giveaway/index.js';

export default {
  include(app, io) {
    Admin.setWebSocket(io);
    User.setWebSocket(io);
    SocketNotification.setWebSocket(io);
    app.use('/ctrldv', Admin);
    app.use('/slbp', SteamLoginByPass);
    app.use('/user', User);  
    app.use('/tickets', Ticket);
    app.use('/coinflip', Coinflip);
    app.use('/gaway', Giveaway);
    // app.use('/api', Test);
    app.use('/', React);  
  }
}