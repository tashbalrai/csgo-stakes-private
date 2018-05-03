import config from './../../config/config.js';
import Mysql from 'mysql';
import Redis from 'redis';

export default class Giveaway {
    constructor(req, res) {
        this.request = req;
        this.response = res;
    }

    getActiveGiveaway() {
        this
        .fetchActiveGiveaway()
        .then(giveaway => {
            if (!giveaway) {
                this
                .response
                .status(500)
                .json({
                    "status": "error",
                    "response": "No giveaway found."
                });
                return;
            }
            
            let redis = Redis.createClient(config.redis);
            redis.on('ready', () => {
                redis.hget(config.steamlyticsCacheKey, giveaway.mhash, (err, item) => {
                    redis.quit();
                    // console.log(err, item);
                    if (err) {
                        console.log(err);
                        this
                        .response
                        .status(500)
                        .json({
                            "status": "error",
                            "response": "Unknown error occurred."
                        });
                        return;
                    }

                    try {
                        item = JSON.parse(item);
                        item.created_at = giveaway.created_at;
                        item.expires_at = giveaway.expires_at;
                    } catch(e) {
                        console.log(err);
                        this
                        .response
                        .status(500)
                        .json({
                            "status": "error",
                            "response": "Unknown error occurred."
                        });
                        return;
                    }

                    this
                    .response
                    .json({
                        "status": "ok",
                        "response": item
                    });
                    return;
                });
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

    fetchActiveGiveaway() {
        return new Promise((resolve, reject) => {
            let 
                db = Mysql.createConnection(config.mysql),
                SQL = "SELECT i.mhash, i.asset_id, g.created_at, g.expires_at FROM inventory AS i LEFT JOIN giveaway AS g ON(i.id=g.inventory_id) WHERE g.state=?";
            
            db.query(SQL, [config.giveaway.states.active], (err, giveaway) => {
                db.end();

                if (err) {
                    reject(err);
                    return;
                }

                // console.log(giveaway);
                resolve(giveaway[0]);
            });
        });
    }
}