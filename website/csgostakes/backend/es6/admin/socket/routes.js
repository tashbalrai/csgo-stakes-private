import Ping from './controllers/ping.js';
import Inventory from './controllers/inventory.js';
import User from './controllers/user.js';

export default {
  routes(socket) {
    socket.on('pingback', data => {
      let ping = new Ping(socket, data);
      ping.ping();
    });
    socket.on('inventory/deposit', data => {
      let inventory = new Inventory(socket, data);
      inventory.deposit();
    });
    socket.on('inventory/user-inhouse-inventory', data => {
      let inventory = new Inventory(socket, data);
      inventory.userInHouseInventory();
    });
    socket.on('user/trade-url', data => {
      let user = new User(socket, data);
      user.setTradeUrl();
    });
  }
};