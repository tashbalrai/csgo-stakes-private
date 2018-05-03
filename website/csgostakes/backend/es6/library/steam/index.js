import getInventory from './inventory.js';
import proxies from './proxies.js';
import config from './../../config/config.js';
import Redis from 'redis';

class SteamInventory {
    constructor() {
        this.redisClient = Redis.createClient(config.redis);
    }

    getUserInventory(steamId) {
        return new Promise((resolve, reject) => {
            if ( typeof steamId == 'undefined' || steamId == null) {
                reject(new Error('SteamID of the user is required.'));
                return;
            }

            this.redisClient.get('proxy-index', (err, index) => {
                if (err != null) {
                    reject(new Error(err.message));
                    return;
                }

                index = !index? 0 : Number(index);
                ++index;
                 
                if (index > proxies.length - 1) {
                    index = 0;
                }

                let proxy = proxies[index];
                // getInventory(steamId, 730, 2, true, "http://" + proxy[1] + "@" + proxy[0]) //with proxy
                getInventory(steamId, 730, 2, true) // without proxy
                .then((items) => {
                    this.redisClient.set('proxy-index', index);
                    this.redisClient.quit();

                    const filtered =  items.filter(i => {
                        return !(i.market_hash_name.search(/souvenir/i) != -1 || i.safe_price < config.inventory.minItemPrice);
                    });
                    resolve(filtered);
                    return;
                })
                .catch((err) => {
                    console.log(err);
                    this.redisClient.quit();
                    reject(err);
                    return;
                });
            });
        });
    }    
}

export default SteamInventory;
