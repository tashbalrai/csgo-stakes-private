import config from './../../config/config.js';
import Mysql from 'mysql';
import Redis from 'redis';

export default class History {
    constructor(req, res) {
        this.request = req;
        this.response = res;
    }

    getLast50Coinflips() {
        this
        .fetchLast50Coinflips()
        .then(games => {
            this
            .response
            .json({
                "status": "ok",
                "response": games
            });
        })
        .catch(err => {
            console.log(err);
            this
            .response
            .status(500)
            .json({
                "status": "error",
                "response": "Unknown error occurred"
            });
        });
    }

    fetchLast50Coinflips() {
        return new Promise((resolve, reject) => {
            let 
                db = Mysql.createConnection(config.mysql),
                SQL = "SELECT g.*, GROUP_CONCAT(JSON_OBJECT('id', u.id, 'avatar', u.avatar, 'profile_name', u.profile_name) SEPARATOR ',' ) AS users FROM game AS g LEFT JOIN game_player AS gp ON(g.id=gp.game_id) LEFT JOIN user AS u ON(u.id=gp.user_id) WHERE g.state = ? AND game_type = 'coinflip' GROUP BY g.id ORDER BY g.id DESC LIMIT 50";

            db.query(SQL, [config.coinflip.states.winnerCalculated], (err, games) => {
                db.end();

                if (err) {
                    reject(err);
                    return;
                }
                
                // console.log(games);
                resolve(games);
            });
        });
    }
}