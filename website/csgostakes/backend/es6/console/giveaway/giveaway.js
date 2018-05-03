import config from './config.js';
import Redis from 'redis';
import Mysql from 'mysql';
import moment from 'moment';

export default class Giveaway {
    constructor(log) {
        this.log = log;
    }

    fetchItemsForGiveaway() {
        return new Promise((resolve, reject) => {
            let 
                db = Mysql.createConnection(config.mysql),
                SQL = " SELECT i.id, i.mhash as market_hash_name, i.user_id FROM inventory AS i LEFT JOIN user AS u ON(u.id = i.user_id) ";
            
            // role_id = 4 is giveaway user ID.
            SQL += ` WHERE u.role_id = ${config.userRoles.giveaway} AND i.state = 1 `;

            db.query(SQL, (err, result) => {
                db.end();

                if (err) {
                    reject(err);
                    return;
                }
                resolve(result);
            });
        });
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
                        reject(err);
                        return;
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

    setup() {
        this
        .checkExisting()
        .then(result => {
            if (result[0].existing > 0) {
                this.log.error('An active giveaway still exist. Exiting.');
                return;
            }
            
            this
            .fetchItemsForGiveaway()
            .then(items => {
                this
                .getPrices(items)
                .then(itemPrices => {
                    let 
                        gaItem = [],
                        pubItem = null;

                    for(let i=0; i<items.length; i++) {
                        if (itemPrices[items[i].market_hash_name] > config.giveaway.maxItemAmount) {
                            continue;
                        }
    
                        gaItem[0] = items[i].id;
                        gaItem[1] = config.giveaway.states.active;
                        gaItem[2] = moment().add(config.giveaway.perMinute, "minutes").format('YYYY-MM-DD HH:mm:ss');
                        
                        pubItem = items[i];
                        //we got one eligible item for giveaway setup; let's break the loop.
                        break;
                    }

                    if (gaItem.length <= 0) {
                        this.log.error('Giveaway item not available.');
                        return;
                    }
    
                    this
                    .addGiveawayItems(gaItem)
                    .then(done => {
                        console.log('Giveaway setup success.');
                        this.log.error('Giveaway setup success.');
                        let redis = Redis.createClient(config.redis);
                        redis.on('ready', () => {
                            redis.publish('notifier.message', JSON.stringify({
                                "event": "broadcast",
                                "subEvent": "giveaway.created",
                                "data": pubItem
                            }), (err, result) => {
                                redis.quit();
                            });
                        });
                    })
                    .catch(err => {
                        this.log.error('AddGiveawayItems: ', err);
                    });
                })
                .catch(err => {
                    this.log.error(err);
                });
            })
            .catch(err => {
                this.log.error(err);
            });
        })
        .catch(err => {
            this.log.error('CheckExisting: ', err);
        });
    }

    addGiveawayItems(gaItem) {
        return new Promise((resolve, reject) => {
            let
                db = Mysql.createConnection(config.mysql),
                lockSQL = 'UPDATE inventory SET state = ? WHERE id = ?',
                SQL = 'INSERT INTO giveaway (inventory_id, state, expires_at) VALUES ?';
            
            
            db.query(lockSQL, [config.itemStates.locked, gaItem[0]], (err, result) => {
                if (err) {
                    db.end();
                    reject(err);
                    return;
                }

                db.query(SQL, [[gaItem]], (err, result) => {
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

    checkExisting() {
        return new Promise((resolve, reject) => {
            let
                db = Mysql.createConnection(config.mysql),
                SQL = ` SELECT count(id) as existing FROM giveaway WHERE state = ${config.giveaway.states.active} `;
            
            db.query(SQL, (err, result) => {
                db.end();
                
                if (err) {
                    retject(err);
                    return;
                }
                
                resolve(result);
            });
        });
    }

    checkIfGiveawayExpired() {
        let
            db = Mysql.createConnection(config.mysql),
            SQL = "SELECT g.*, i.mhash, i.user_id FROM giveaway AS g LEFT JOIN inventory AS i ON(i.id = g.inventory_id) WHERE g.expires_at < NOW() AND g.state = ? LIMIT 1";
                
        db.query(SQL, [config.giveaway.states.active], (err, giveaway) => {
            
            if (err) {
                db.end();
                this.log.error(err);
                return;
            }

            if (giveaway.length <= 0) {
                db.end();
                this.setup();
                return;
            }

            let SQL = "SELECT id, profile_name, steam_id FROM user WHERE profile_name LIKE '%csgostakes.com%' AND is_banned = 0 AND is_chat_banned = 0 ORDER BY RAND() LIMIT 1";

            db.query(SQL, (err, user) => {
                if (err) {
                    db.end();
                    this.log.error(err);
                    return;
                }

                if (user.length <= 0) {
                    db.query('UPDATE giveaway SET expires_at = ? WHERE id = ?', 
                    [
                        moment().add(config.giveaway.perMinute, "minutes").format('YYYY-MM-DD HH:mm:ss'), 
                        giveaway[0].id
                    ],
                    (err, result) => {
                        db.end();

                        if (err) {
                            this.log.error(err);
                        }

                        this.log.error('Giveaway extended.');
                        return;
                    });
                    return;
                }
                
                let winMsg = `${user[0].profile_name} has won a ${giveaway[0].mhash}`;
                
                db.query('UPDATE giveaway SET winner_id = ?, announced_at = ?, state = ? WHERE id = ?',
                [user[0].id, moment().format('YYYY-MM-DD HH:mm:ss'), config.giveaway.states.announced, giveaway[0].id],
                (err, result) => {
                    if (err) {
                        db.end();
                        this.log.error(err);
                        return;
                    }

                    db.query('UPDATE inventory SET user_id = ?, notes = ? WHERE id = ? LIMIT 1',
                    [user[0].id, `Giveaway# ${giveaway[0].id}`, giveaway[0].inventory_id],
                    (err, result) => {
                        if (err) {
                            db.end();
                            this.log.error(err);
                            return;
                        }

                        db.query("INSERT INTO chat(user_id, message) VALUES(?,?)",
                        [giveaway[0].user_id, winMsg],
                        (err, result) => {
                            db.end();
    
                            if (err) {
                                this.log.error(err);
                                return;
                            }
    
                            let redis = Redis.createClient(config.redis);
                            redis.on('ready', () => {
                                redis.publish('notifier.message', JSON.stringify({
                                    "event": "broadcast",
                                    "subEvent": "giveaway.announced",
                                    "data": {
                                        "id": giveaway[0].id,
                                        "market_hash_name": giveaway[0].mhash,
                                        "winner": giveaway[0].user_id
                                    }
                                }), (err, result) => {
                                    redis.quit();
                                });
                            });
    
                            this.log.error('Giveaway announced.');
                            setTimeout(this.setup.bind(this), 10000);
                        });
                    });
                });
            });
        });
    }

    checkIfUserItemExpired() {
        console.log('Started item expiry check.');
        // TODO:
        // Item was not in game inventory for at least 6 hours
        // Expire the item from game inventory and put notes
        this
        .getExpiredGiveaways()
        .then(giveaways => {
            if (giveaways.length <= 0) {
                this.log.error('No expired giveaways.');
                return;
            }

            this
            .getExpireableItems(giveaways)
            .then(eaGiveaways => {
                this
                .getGiveawayAccount()
                .then(user => {
                    this
                    .revertGiveawayItems(eaGiveaways, user)
                    .then(done => {
                        this
                        .setGiveawayExpired(eaGiveaways)
                        .then(done => {
                            this.log.error('Giveaway items reverted.');
                            console.log('Giveaway items reverted.');
                        })
                        .catch(err => {
                            this.log.error(err);    
                        });
                    })
                    .catch(err => {
                        this.log.error(err);
                    });
                })
                .catch(err => {
                    this.log.error(err);
                });
            })
            .catch(err => {
                this.log.error(err);
            });
        })
        .catch(err => {
            this.log.error(err);
        });
    }

    getExpiredGiveaways() {
        return new Promise((resolve, reject) => {
            let
                db = Mysql.createConnection(config.mysql),
                SQL = "SELECT id, inventory_id, winner_id, TIMESTAMPDIFF(HOUR, announced_at, NOW()) AS hour_diff FROM giveaway WHERE state = ? AND TIMESTAMPDIFF(HOUR, announced_at, NOW()) >= ?";
        
            db.query(SQL, [config.giveaway.states.announced, config.giveaway.itemExpireTime], 
                (err, giveaways) => {
                db.end();

                if (err) {                    
                    reject(err);
                    return;
                }

                resolve(giveaways);
            });
        });
    }

    getGiveawayAccount() {
        return new Promise((resolve, reject) => {
            let
                db = Mysql.createConnection(config.mysql),
                SQL = "SELECT id, steam_id FROM user WHERE role_id = ?";
        
            db.query(SQL, [config.userRoles.giveaway], 
                (err, user) => {
                db.end();

                if (err) {                   
                    reject(err);
                    return;
                }

                resolve(user);
            });
        });
    }

    getExpireableItems(giveaways) {
        return new Promise((resolve, reject) => {
            let iList = [];

            for(let i=0; i<giveaways.length; i++) {
                iList.push(giveaways[i].inventory_id);
            }

            let db = Mysql.createConnection(config.mysql);

            db.query('SELECT id, inventory_id FROM game_inventory WHERE inventory_id IN ?',
            [[iList]], (err, playedItems) => {
                db.end();

                if (err) {
                    reject(err);
                    return;
                }

                for(let i=0; i<playedItems.length; i++) {
                    for(let j=0; j<giveaways.length; j++) {
                        if (giveaways[j].inventory_id == playedItems[i].inventory_id) {
                            giveaways.splice(i, 1);
                        }
                    }
                }
                
                resolve(giveaways);
            });
        });
    }

    revertGiveawayItems(giveaways, user) {
        return new Promise((resolve, reject) => {
            if (giveaways.length <= 0) {
                reject(new Error('no giveaways to expire'));
                return;
            }

            let iList = [];
            for(let i=0; i<giveaways.length; i++) {
                iList.push(giveaways[i].inventory_id);
            }

            let db = Mysql.createConnection(config.mysql);
            db.query('UPDATE inventory SET user_id = ?, notes = "Giveaway expired" WHERE id IN ?',
            [user[0].id, [iList]], (err, result) => {
                db.end();

                if (err) {
                    reject(err);
                    return;
                }

                resolve(result);
            });
        });
    }

    setGiveawayExpired(giveaways) {
        return new Promise((resolve, reject) => {
            if (giveaways.length <= 0) {
                reject(new Error('No giveaways to expire.'));
                return;
            }

            let iList = [];
            for(let i=0; i<giveaways.length; i++) {
                iList.push(giveaways[i].id);
            }

            console.log(giveaways);

            let 
                db = Mysql.createConnection(config.mysql),
                SQL = 'UPDATE giveaway SET state = ? WHERE id IN ?';
            
            db.query(SQL, 
            [config.giveaway.states.expired, [iList]],
            (err, result) => {
                db.end();

                if (err) {
                    reject(err);
                    return;
                }

                resolve(result);
            });
        });
    }
}