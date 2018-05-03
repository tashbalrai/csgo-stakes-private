import Redis from 'redis';
import config from './../config/config';

export default function (req, res, next) {
    let pattTradeUrl = /^https\:\/\/steamcommunity\.com\/tradeoffer\/new\/\?partner=(\d+)&token=([\w\d-]+)$/im;
    if (!pattTradeUrl.test(req.user.trade_url)) {
        res
        .json({
            "status": "error",
            "response": "Your trade URL seems invalid. Make sure you have updated your latest trade URL."
        })
        .end();
        return;
    }

    if (!req.body.inventory) {
        res
        .json({
            "status": "error",
            "response": "Inventory items were not found in request."
        })
        .end();
        return;
    }
    
    let items = req.body.inventory;
    
    getPrices(items)
    .then(prices => {
        let invalidItems = [];
        for (let i=0; i<items.length; i++) {
            if (typeof prices[items[i].market_hash_name] == 'undefined') {
                let idx = invalidItems.length;
                invalidItems[idx] = items[i];
                invalidItems[idx].error = `Cannot get price for '${items[i].market_hash_name}'.`;
                continue;
            }

            if (prices[items[i].market_hash_name].safe_price <= config.inventory.minItemPrice) {
                let idx = invalidItems.length;
                invalidItems[idx] = items[i];
                invalidItems[idx].error = `Item '${items[i].market_hash_name}' doesn't meet the minimum value criteria.`;
                continue;
            }

            items[i].price = prices[items[i].market_hash_name];
        }

        if (invalidItems.length > 0) {
            res
            .json({
                "status": "error",
                "response": {
                    "items": invalidItems,
                    "error": "Some items doesn't meet the criteria."
                }
            })
            .end();
            return;
        }

        req.body.inventory = items;
        next();
    })
    .catch(err => {
        console.log(err);
        res
        .status(500)
        .json({
            "status": "error",
            "response": "Unkown error occurred. Please try again later."
        })
        .end();
        return;
    });
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
                for(let i=0; i<priceList.length; i++) {
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