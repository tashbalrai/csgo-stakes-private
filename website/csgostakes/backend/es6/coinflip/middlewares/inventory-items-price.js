import Redis from 'redis';
import Mysql from 'mysql';
import config from './../config/config';

export default function (req, res, next) {
    
    if (!Array.isArray(req.body.items) || req.body.items.length <= 0) {
        let error = new Error("Inventory items were not found in request (IIP01).");
        error.httpStatusCode = 400;
        error.code = "JSONRES";
        next(error);
        return;
    }
        
    let itemIds = req.body.items;

    if (!itemIds.every(isFinite)) {
        let error = new Error("All item IDs must be integers (IIP02).");
        error.httpStatusCode = 400;
        error.code = "JSONRES";
        next(error);
        return;
    }
    
    getItems(itemIds, req.user.id)
    .then(dbItems => {
        if (dbItems.length != itemIds.length) {
            let error = new Error("Some of the items are not available. Please review and try again (IIP03).");
            error.httpStatusCode = 200;
            error.code = "JSONRES";
            next(error);
            return;
        }

        getPrices(dbItems)
        .then(prices => {
            let invalidItems = [];
            for (let i=0; i<dbItems.length; i++) {
                if (typeof prices[dbItems[i].market_hash_name] == 'undefined') {
                    let idx = invalidItems.length;
                    invalidItems[idx] = dbItems[i];
                    invalidItems[idx].error = `Cannot get price for '${dbItems[i].market_hash_name}' (IIP04).`;
                    continue;
                }
    
                if (prices[dbItems[i].market_hash_name].safe_price <= 0) {
                    let idx = invalidItems.length;
                    invalidItems[idx] = dbItems[i];
                    invalidItems[idx].error = `Item '${dbItems[i].market_hash_name}' have price zero (IIP05).`;
                    continue;
                }
    
                dbItems[i].price = prices[dbItems[i].market_hash_name];
            }
    
            if (invalidItems.length > 0) {
                let error = new Error({
                    "items": invalidItems,
                    "error": "Some items doesn't meet the criteria (IIP06)."
                });
                error.httpStatusCode = 200;
                error.code = "JSONRES";
                next(error);
                return;
            }
    
            req.body.inventory = dbItems;
            next();
        })
        .catch(err => {
            console.log(err);
            let error = new Error("Unkown error occurred. Please try again later (IIP07).");
            error.internalError = err;
            error.httpStatusCode = 500;
            error.code = "JSONRES";
            next(error);
            return;

        });
    })
    .catch(err => {
        console.log(err);
        let error = new Error("Unkown error occurred. Please try again later (IIP08).");
        error.internalError = err;
        error.httpStatusCode = 500;
        error.code = "JSONRES";
        next(error);
        return;
    })
    
}

function getPrices(items) {
      return new Promise((resolve, reject) => {
        if (items.length <= 0) {
            resolve([]);
            return;
        }

        let itemKeys = [config.steamlyticsCacheKey];
        for(let i=0; i<items.length; i++) {
            itemKeys.push(items[i].market_hash_name);
        }

        let redis = Redis.createClient(config.redis);
        redis.on('ready', () => {
            redis.hmget(itemKeys, (err, priceList) => {
                redis.quit();
                if (err) {
                    console.log(err);
                    reject(err);
                }

                let prices = {};
                for (let i=0; i<priceList.length; i++) {
                    let item = null;
                    try {
                        item = JSON.parse(priceList[i]);
                        if(item) prices[item.name] = item;
                    } catch(e) {
                        reject(e);
                        return;
                    }
                }

                resolve(prices);                
            });
        });
      });
  }

function getItems(itemIds, uid) {
    return new Promise((resolve, reject) => {
        if (!Array.isArray(itemIds)) {
            reject(new Error('Items ids must be an array of ids (IIP09).'));
            return;
        }

        if (itemIds.length <= 0) {
            reject(new Error('Items ids must be an array of ids (IIP10).'));
            return;
        }

        if (!uid) {
            reject(new Error('User ID is required to get the items (IIP11).'));
            return;
        }

        let SQL = "SELECT *, mhash as market_hash_name FROM inventory WHERE id IN ? AND user_id = ?";
        let db = Mysql.createConnection(config.mysql);

        db.query(SQL, [[itemIds], uid], (err, items) => {
            db.end();

            if (err) {
                reject(err);
                return;
            }

            resolve(items);
        });
    });
}