import config from './../../config/config.js';

export default class Index {
  constructor(req, res) {
    this.request = req;
    this.response = res;
    this.data = {};
  }
  
  index() {
    let 
      token = null,
      uid = null;
    if (this.request.session.user) {
      token = this.request.session.user.token;
      uid = this.request.session.user.id;
      this.response.append('x-access-token', token);
      this.response.append('x-user-sid', uid);
    }    
    this.response.render('index', {token, uid});
  }
}