import crypto from 'crypto';
import config from './../../config/config.js';
import redis from 'redis';

export default class RedisToken {
  connect() {
    return new Promise((resolve, reject) => {
      let client = null;
      client = redis.createClient(config.redis);
      client.on('error', (err) => {
        reject(err);
      });
      
      client.on('ready', ()=>{
        resolve(client);
      });
    });
  }
  
  getToken(ID, IP) {
    if (!ID) {
      throw new Error('ID is required for token generation');
    }
    
    if (!IP) {
      throw new Error('IP is required for token generation');
    }
    
    const hash = crypto.createHash('sha256');
    hash.update(IP + config.apiToken.salt + ID + IP);
    const token = hash.digest('hex');
    return token;
  }
  
  tokenize(userId, ip, user) {
    return new Promise((resolve, reject) => {
      user.token = this.getToken(userId, ip);
      
      this.set(user.token, user).then(result => {
        resolve(user.token);
      }).catch(err => {
        reject(err);
      });
    });    
  }
  
  remove(token) {
    return new Promise((resolve, reject) => {
      this.connect().then(client => {
        client.del(config.apiToken.prefix + token, (err, result) => {
          if (err) {
            reject(err);
            return;
          }
          
          resolve(result);
        });
      }).catch(err => {
        reject(err);
      });
    });
  }
  
  get(token) {
    return new Promise((resolve, reject) => {
      this.connect().then(client => {
        client.get(config.apiToken.prefix + token, (err, result) => {
          if (err) {
            reject(err);
            return;
          }
          
          resolve(result);
        });
      }).catch(err => {
        reject(err);
      });
    });
  }
  
  set(token, data) {
    return new Promise((resolve, reject) => {
      this.connect().then(client => {
        client.setex(config.apiToken.prefix + token, config.apiToken.ttl, JSON.stringify(data), (err, result) => {
          if (err) {
            reject(err);
            return;
          }
          
          resolve(result);
        });
      }).catch(err => {
        reject(err);
      });
    });
  }
}  