import config from './../config/config';
import Mysql from 'mysql';

export default function (err, req, res, next) {
    if (err.revertLockedToActive) {
        // We were not able to save the game in redis for processing
        // Let's revert the state in DB too to active state
        let db = Mysql.createConnection(config.mysql);
        db.query("UPDATE game SET state = ? WHERE id = ? AND state = ? LIMIT 1",
        [config.coinflip.states.active, req.body.game.id, config.coinflip.states.locked],
        (err, result) => {
            db.end();

            if (err) {
                let error = new Error("Unknown error occurred.");
                error.internalError = err;
                next(error);
            }
        });
    }    
    
    next(err);
}
