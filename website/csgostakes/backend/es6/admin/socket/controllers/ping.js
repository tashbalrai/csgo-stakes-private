import Trade from './../../helpers/steamtrade.js';

export default class Ping {
  constructor(socket, data = 'ping') {
    if (typeof socket !== 'object') {
      throw new Error('Socket controller require a socket object.');
    }
    this.socket = socket;
    this.session = socket.request.session;
    this.data = data;
  }
  
  ping() {
    Trade.scanUserInventory(this.session.user.tradeUrl, (err, result) => {
      console.log(err, result);
    });
    
    Trade.getUserInventory(this.session.user.tradeUrl).then(inventory => {
      console.log(inventory);
    }).catch(err => {
      console.log(err);
    })
    this.socket.emit('ping/response', this.data);
  }  
}