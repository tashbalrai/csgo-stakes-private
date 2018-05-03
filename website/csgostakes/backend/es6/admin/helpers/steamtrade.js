import config from './../../config/config.js';
import https from 'https';
import querystring from 'querystring';

const TOKEN = 'suKKqCdrPhzDc256iQGelwwlR8EN5O6nPuaEEqUloQw0zf9JB5mbA0071o2XGdJl';

export default {
  callApi(api, method) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'steamtrad.es',
        path: '/api/v1' + api,
        method,
        headers: {
          "Authorization": "Token " + TOKEN
        }
      };
      
      let data = '';
      const req = https.request(options, (res) => {
        res.on('data', (resData) => {
          data += resData;
        });
        
        res.on('end', () => {
          resolve(data);
        });
      });
      req.end();
      
      req.on('error', err => {
        reject({
          code: 'unknown',
          error: err
        });
      });
    });
  },
  
  scanUserInventory(tradeUrl, cb, attempt = 5) {
    if (attempt <= 0) {
      if (typeof cb === 'function') {
        cb((new Error('Max number of attempts for inventory scan reached.')), null);
      }
      return;
    }
    
    let params = querystring.stringify({
      trade_url: tradeUrl,
      context_id: 1
    });
    
    this.callApi('/item/scan_user_inventory/?' + params, 'POST').then(result => {
        result = JSON.parse(result);
        if (result.completed === true && result.eta === 0) {
          if (typeof cb === 'function') {
            cb(null, result);
            return;
          }
        } else {
          setTimeout(this.scanUserInventory.bind(this), 100, tradeUrl, cb, --attempt);
        }
    }).catch(err => {
      if (typeof cb === 'function') {
        cb(err, null);
      }
    });
  },
  
  getUserInventory(tradeUrl) {
    return new Promise((resolve, reject) => {
      let params = querystring.stringify({
        trade_url: tradeUrl,
        context_id: 1
      });
      
      this.callApi('/item/user_inventory/?' + params, 'GET').then(result => {
        resolve(result);        
      }).catch(err => { 
        reject(err);
      });  
    });    
  }
}