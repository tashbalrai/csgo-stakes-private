import config from './../../config/config.js';
import Redis from 'redis';
import request from 'request-promise-native';
import ignoreList from './ignore-list.js';

export default class SteamlyticsPrices {
  constructor(log) {
    this.log = log;
  }

  fetchPriceList() {
    return new Promise((resolve, reject) => {
      let options = {
          uri: 'http://api.csgo.steamlytics.xyz/v2/pricelist',
          qs: {
              key: config.steamlyticsAPIKey
          },
          headers: {
              'Content-Type': 'application/json'
          },
          json: true // Automatically parses the JSON string in the response 
      };
 
      request(options)
        .then((list) => {
          console.log('Got price list.');
          resolve(list);
        })
        .catch((err) => {
            console.log(err);
            reject(err);
        });
    });
  }

  cachePrice() {
    this
    .fetchPriceList()
    .then(list => {
      let rlist = [config.steamlyticsCacheKey];
      
      for(let mhash in list.items) {
        if (Number(list.items[mhash].safe_price) == 0) {
          continue;
        }

        if (ignoreList[mhash.toLowerCase()]) {
          console.log('Ignored list: ', mhash.toLowerCase())
          continue;
        }

        rlist.push(mhash);
        // console.log(mhash, JSON.stringify(list.items[mhash]));
        rlist.push(JSON.stringify(list.items[mhash]));
      }

      let redis = Redis.createClient(config.redis);
      redis.on('ready', () => {
        redis.hmset(rlist, (err, result) => {
          redis.quit();
          if (err) {
            console.log(err);
            this.log.error('Steamlytics: error setting prices in redis.', err);
          }
          console.log('Steamlytics: Successfully logged all the item prices.');
          this.log.info('Steamlytics: Successfully logged all the item prices.');
        });
      });      
    })
    .catch(err => {
      console.log(err);
      this.log.error('Steamlytics: error fetching price list.', err);
    });
  }

}
