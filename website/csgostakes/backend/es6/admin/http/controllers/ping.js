export default class Ping {
  constructor(req, res) {
    this.request = req;
    this.response = res;
  }
  
  ping() {
    this.response.send('Hello HTTP World!');
    this.response.end();
  }
}