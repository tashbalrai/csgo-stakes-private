import Redis from 'redis';
import Mysql from 'mysql';
import config from './../../config/config.js';
import SteamInventory from './../../../library/steam/index.js';

export default class Inventory {
    constructor(req, res) {
        this.request = req;
        this.response = res;
    }

    getUserSteamInventory() {
        if (this.request.user) {
            let steamInventory = new SteamInventory();
            steamInventory
                .getUserInventory(this.request.user.steam_id)
                .then((items) => {
                    this
                        .getPrices(items)
                        .then(prices => {
                            const filtered = [];
                            for (let i = 0; i < items.length; i++) {
                              const price = prices[items[i].market_hash_name];
                              if (typeof price != 'undefined') {
                                    const safePrice = Number(price.safe_price);
                                    if(safePrice > config.inventory.minItemPrice) {
                                      items[i].price = price;
                                      filtered.push(items[i]);
                                    }
                                }
                            }

                            this
                                .response
                                .json({
                                    "status": "ok",
                                    "response": filtered
                                })
                                .end();
                        })
                        .catch(err => {
                            console.log(err);

                            this
                                .response
                                .status(500)
                                .json({
                                    "status": "error",
                                    "response": "Unknown error occurred."
                                })
                                .end();
                        });
                })
                .catch((err) => {
                    console.log(err);

                    this
                        .response
                        .status(500)
                        .json({
                            "status": "error",
                            "response": "Unknown error occurred."
                        })
                        .end();
                });
        } else {
            this
                .response
                .status(400)
                .end();
        }
    }

    getPrices(items) {
        return new Promise((resolve, reject) => {
            if (items.length <= 0) {
                resolve([]);
                return;
            }

            let itemKeys = [config.steamlyticsCacheKey];
            for (let i = 0; i < items.length; i++) {
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
                    for (let i = 0; i < priceList.length; i++) {
                        let item = null;
                        try {
                            item = JSON.parse(priceList[i]);
                            if(item) prices[item.name] = item;
                        } catch (e) {
                            reject(e);
                            return;
                        }
                    }

                    resolve(prices);
                });
            });
        });
    }

    deposit() {
        let db = Mysql.createConnection(config.mysql);
        let deposit = {
            user_id: this.request.user.id,
            items: JSON.stringify(this.request.body.inventory),
            state: config.depositStates.queued
        };

        db.query('INSERT INTO deposit SET ?',
            [deposit],
            (err, result) => {
                db.end();
                
                if (err) {
                    console.log(err);
                    this
                    .response
                    .status(500)
                    .json({
                        "status": "error",
                        "response": "Unknown error occurred. Please try again later."
                    })
                    .end();
                    return;
                }

                this
                .response
                .json({
                    "status": "ok",
                    "response": "You deposit has been queued successfully."
                })
                .end();
        });
    }

    pendingDeposits() {
        let db = Mysql.createConnection(config.mysql);

        db.query('SELECT * FROM deposit WHERE user_id = ? AND state in ?', 
        [this.request.user.id, [[
            config.depositStates.error,
            config.depositStates.queued,
            config.depositStates.offerSent,
            config.depositStates.offerAccepted
        ]]],
        (err, records) => {
            db.end();
            if (err) {
                console.log(err);
                
                this
                .response
                .status(500)
                .json({
                    "status": "error",
                    "response": "Unknown error occurred. Please try again later."
                })
                .end();
                return;
            }

            this
            .response
            .json({
                "status": "ok",
                "response": records
            })
            .end();
        });
    }

    getOnsiteInventory() {
        let db = Mysql.createConnection(config.mysql);
        db.query('SELECT * FROM inventory WHERE user_id = ? AND state = ?',
          [this.request.user.id, 1],
          (err, records) => {
            db.end();
            if (err) {
              this
                .response
                .status(500)
                .json({
                  "status": "error",
                  "response": "Unknown error occurred. Please try again later."
                })
                .end();
              return;
            }

            const items = records.map(r => Object.assign(r, {market_hash_name: r.mhash}));

            this.getPrices(items).then(
              prices => {
                const filtered = [];
                for (let i = 0; i < items.length; i++) {
                  const price = prices[items[i].market_hash_name];
                  if (typeof price != 'undefined') {
                    items[i].price = price;
                    filtered.push(items[i]);
                  }
                }
                this
                  .response
                  .json({
                    "status": "ok",
                    "response": filtered
                  })
                  .end();
              },
              e => {
                this
                  .response
                  .status(500)
                  .json({
                    "status": "error",
                    "response": "Unknown error occurred. Please try again later."
                  })
                  .end();
              }
            );
          });
    }

    withdraw() {
        // check the items
        let items = this.request.body.items;
        if (!Array.isArray(items)) {
            this
            .response
            .status(400)
            .json({
                "status": "error",
                "response": "Invalid items format."
            });
            return;
        }

        this
        .getInventoryItemsByIds(items)
        .then(itemsPerBot => {
            if (itemsPerBot.length <= 0) {
                this
                .response
                .json({
                    "status": "error",
                    "response": "No items are available to withdraw."
                });
                return;
            }

            let response = {
                "response": {
                    "successItems":[],
                    "errorItems":[]
                }
            };

            (function loop(i, max, done) {
                if (i < max) {
                    new Promise((resolve, reject) => {
                        let 
                            dbItems = itemsPerBot[i],
                            itemIds = dbItems.id.split(','),
                            assetIds = dbItems.items.split(',');

                        this
                        .queueItemsForWithdrawal(itemIds)
                        .then(lockResult => {
                            this
                            .queueWithdraw()
                            .then(wid => {
                                this
                                .queueWithdrawItems(itemIds, wid)
                                .then(result => {
                                    response.response.successItems[response.response.successItems.length] = {
                                        "withdrawId": wid,
                                        itemIds
                                    };
                                    resolve(result);
                                })
                                .catch(err => {
                                    console.log('queue withdraw items', err);
                                    response.response.errorItems[response.response.errorItems.length] = {itemIds};
                                    response.response.error = "Cannot process some of the items.";
                                    // Let's try to revert item lock
                                    setTimeout(() => {
                                        this.activateItems.call(this, itemIds);
                                        this.cleanQueuedWithdraw.call(this, wid);
                                    }, 0);
                                    reject(err);
                                });
                            })
                            .catch(err => {
                                console.log('queue withdraw', err);
                                response.response.errorItems[response.response.errorItems.length] = {itemIds};
                                response.response.error = "Cannot process some of the items.";
                                // Let's try to revert item lock
                                setTimeout(this.activateItems.bind(this), 0, itemIds);
                                
                                reject(err);
                            });
                        })
                        .catch(err => {
                            console.log('lock ', err);
                            response.response.errorItems[response.response.errorItems.length] = {itemIds};
                            response.response.error = "Cannot process some of the items.";
                            reject(err);
                        });
                    })
                    .then(loop.bind(this, i+1, max, done))
                    .catch(loop.bind(this, i+1, max, done));
                } else {
                    done(response);
                }
            }.bind(this))(0, itemsPerBot.length, (response) => {
                // All withdraws inserted.
                if (response.response.error) {
                    response.status = "error";
                } else {
                    response.status = "ok";
                }

                this.response.send(response);
            });
        })
        .catch(err => {
            console.log(err);
            this
            .response
            .status(500)
            .json({
                "status": "error",
                "response": "Unknown error occurred."
            });
        });
    }

    getInventoryItemsByIds(itemIds) {
        return new Promise((resolve, reject) => {
            if (!Array.isArray(itemIds)) {
                reject(new Error('Items should be an array.'));
                return;
            }

            let SQL = "SELECT bot_id, GROUP_CONCAT(id SEPARATOR ',') as id, GROUP_CONCAT(asset_id SEPARATOR ',') as items, GROUP_CONCAT(mhash SEPARATOR ',') as mhash FROM inventory ";
            SQL += " WHERE id IN ? AND user_id = ? AND state = ? GROUP BY bot_id";

            let db = Mysql.createConnection(config.mysql);
            db.query(SQL, [
                [itemIds],
                this.request.user.id,
                config.itemStates.locked
            ], (err, dbItems) => {
                db.end();

                if (err) {
                    reject(err);
                    return;
                }

                resolve(dbItems);
            });
        });
    }

    queueItemsForWithdrawal(itemIds) {
        return new Promise((resolve, reject) => {
            if (!Array.isArray(itemIds)) {
                reject(new Error('Items to lock should be an array.'));
                return;
            }

            if (itemIds.length <= 0) {
                reject(new Error('Items to lock should not be empty.'));
                return;
            }

            let db = Mysql.createConnection(config.mysql);
            db.query('UPDATE inventory SET state = ? WHERE id IN ? AND user_id = ? AND state = ?',
            [
                config.itemStates.queuedForWithdraw,
                [itemIds],
                this.request.user.id,
                config.itemStates.locked
            ],
            (err, result) => {
                db.end();

                if (err) {
                    reject(err);
                    return;
                }

                resolve(result);
            })
        });
    }

    activateItems(itemIds) {
        return new Promise((resolve, reject) => {
            if (!Array.isArray(itemIds)) {
                reject(new Error('Items to activate should be an array.'));
                return;
            }

            if (itemIds.length <= 0) {
                reject(new Error('Items to activate should not be empty.'));
                return;
            }

            let db = Mysql.createConnection(config.mysql);
            db.query('UPDATE inventory SET state = ? WHERE id IN ? AND user_id = ?',
            [
                config.itemStates.active,
                [itemIds],
                this.request.user.id
            ],
            (err, result) => {
                db.end();

                if (err) {
                    reject(err);
                    return;
                }

                resolve(result);
            })
        });
    }

    queueWithdraw() {
        return new Promise((resolve, reject) => {
            let db = Mysql.createConnection(config.mysql);
            db.query('INSERT INTO withdraw(user_id, state) VALUES (?, ?)',
            [
                this.request.user.id,
                config.withdrawStates.error
            ],
            (err, result) => {
                db.end();
                if (err) {
                    reject(err);
                    return;
                }

                resolve(result.insertId);
            });
        });
    }

    queueWithdrawItems(itemIds, wid) {
        return new Promise((resolve, reject) => {
            if (!Array.isArray(itemIds)) {
                reject(new Error('Items to queue should be an array.'));
                return;
            }

            if (itemIds.length <= 0) {
                reject(new Error('Items to queue withdraw should not be empty.'));
                return;
            }

            let items = [];
            for(let i=0; i<itemIds.length; i++) {
                items.push([
                    wid,
                    itemIds[i]
                ]);
            }

            let db = Mysql.createConnection(config.mysql);
            db.query('INSERT INTO withdraw_item(withdraw_id, inventory_id) VALUES ?',
            [items],
            (err, result) => {
                if (err) {
                    db.end();
                    reject(err);
                    return;
                }

                db.query('UPDATE withdraw SET state = ? WHERE id = ?',
                [
                    config.withdrawStates.queued,
                    wid
                ],
                (err, result) => {
                    db.end();

                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(result);
                });
            });
        });
    }

    cleanQueuedWithdraw(wid) {
        return new Promise((resolve, reject) => {
            let db = Mysql.createConnection(config.mysql);

            db.query('DELETE FROM withdraw WHERE id = ? LIMIT 1', [wid], (err, result) => {
                if (err) {
                    db.end();
                    reject(err);
                    return;
                }

                db.query('DELETE FROM withdraw_item WHERE withdraw_id = ?', [wid], (err, result) => {
                    db.end();

                    if (err) {
                        reject(err);
                        return;
                    }

                    resolve(result);
                })
            });
        });
    }
}