import userValidator from './../../helpers/user-validator.js';
import assetIdValidator from './../../helpers/asset-id-validator.js';

export default class Inventory {
  constructor(socket, data) {
    if (typeof socket !== 'object') {
      throw new Error('Socket controller require a socket object.');
    }
    this.socket = socket;
    this.user = socket.request.session.user;
    this.data = data;
  }
  
  deposit() {
    let userValidatorResponse = userValidator(this.user, this.data);
    if (true !== userValidatorResponse) {
      this.socket.emit('inventory/deposit/response', userValidatorResponse);
      return;
    }
    
    let assetValidatorResponse = assetIdValidator(this.user, this.data.data.aid);
    if(true !== assetValidatorResponse) {
      this.socket.emit('inventory/deposit/response', assetValidatorResponse);
      return;
    }
    
    this.makeDepositRequest();
  }
  
  makeDepositRequest() {
    this.socket.emit('inventory/deposit/response', 'Reached here');
  }
  
  userInHouseInventory() {
    let userValidatorResponse = userValidator(this.user, this.data);
    if (true !== userValidatorResponse) {
      this.socket.emit('inventory/user-inhouse-inventory/response', userValidatorResponse);
      return;
    }
    
    r.table('inventory').filter({owner: this.data.data.sid}).run().then((result) => {
      this.socket.emit('inventory/user-inhouse-inventory/response', {
        error: false,
        code: null,
        message: 'OK',
        data: result
      });
    }).error((err) => {
      this.socket.emit('inventory/user-inhouse-inventory/response', {
        error: true,
        code: 'inv1006',
        message: err.message,
        data: null
      });
    });
  }
  
  
}