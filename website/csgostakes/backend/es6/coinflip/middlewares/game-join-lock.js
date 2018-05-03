import config from './../config/config';
import Mysql from 'mysql';
import Redis from 'redis';

export default function (req, res, next) {
    let db = Mysql.createConnection(config.mysql);
    db.query("UPDATE game SET state = ? WHERE id = ? AND state = ? LIMIT 1",
    [config.coinflip.states.locked, req.body.game.id, config.coinflip.states.active],
    (err, result) => {
        db.end();

        if (err) {
            console.log(err);
            let error = new Error("Unknown error occurred. Please try again later (GJL01).");
            error.internalError = err;
            error.httpStatusCode = 500;
            error.code = "JSONRES";
            next(error);
            return;
        }

        if (!result.changedRows) {
            let error = new Error("Seems game is no longer active. Please try again later (GJL02).");
            error.httpStatusCode = 200;
            error.code = "JSONRES";
            next(error);
            return;
        }

        req.body.game.state = config.coinflip.states.locked;

        let redis = Redis.createClient(config.redis);

        redis.on('ready', () => {
            redis.hset(config.coinflip.cacheKey, `coinflip.${req.body.game.id}`, JSON.stringify(req.body.game), (err, result) => {
                redis.quit();
    
                if (err) {
                    console.log(err);
                    let error = new Error("Cannot save game. Please try again later (GJL03).");
                    error.httpStatusCode = 200;
                    error.code = "JSONRES";
                    error.internalError = err;
                    error.revertLockedToActive = true;
                    next(error);
                    return;
                }
                
                next();
            });
        });        
    });
}
