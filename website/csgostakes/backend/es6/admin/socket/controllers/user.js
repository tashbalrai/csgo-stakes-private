
export default class User {
  constructor(socket, data) {
    if (typeof socket !== 'object') {
      throw new Error('Socket controller require a socket object.');
    }
    this.socket = socket;
    this.user = socket.request.session.user;
    this.data = data;
  }
  
  setTradeUrl() {
    if(this.user.token !== this.data.token) {
      this.socket.emit('user/trade-url/response', {
        error: true,
        code: 'usr1000',
        message: 'Invalid security token.',
        data: null
      });
      return;
    }
    
    if (this.user.id !== this.data.data.sid) {
      this.socket.emit('user/trade-url/response', {
        error: true,
        code: 'usr1001',
        message: 'Unable to validate the current user.',
        data: null
      });
      return;
    }
    let tradeUrlReg = /^https:\/\/steamcommunity\.com\/tradeoffer\/new\/\?partner=([0-9]+)&token=(.+)$/i;
    let regMatch = this.data.data.tradeUrl.match(tradeUrlReg);
    
    if (!regMatch) {
      this.socket.emit('user/trade-url/response', {
        error: true,
        code: 'usr1002',
        message: 'The trade URL supplied is invalid.',
        data: null
      });
      return;
    }
    
    r.table('users').get(this.user.id).update({
      tradeUrl: regMatch[0],
      tradeUrlToken: regMatch[2]
    }).then(result => {
      this.socket.emit('user/trade-url/response', {
        error: false,
        code: null,
        message: 'OK',
        data: result
      });
    }).error(err => {
      this.socket.emit('user/trade-url/response', {
        error: true,
        code: 'usr1003',
        message: 'Unknow error occurred while updating the trade URL.',
        data: null
      });
    });
  }
   
}