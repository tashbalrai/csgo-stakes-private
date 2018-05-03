import config from './../config/config';
import Mysql from 'mysql';
import Redis from 'redis';

export default function (req, res, next) {
    if (!req.body.game) {
        let error = new Error("Unable to load game from request (IR-CFJPRC01).");
        error.httpStatusCode = 400;
        error.code = "JSONRES";
        next(error);
        return;

        // TODO: Try to revert the game state from game_id
    }

    let price = Number(req.body.game.owner.totalValue);
    let minRange = price - (price * config.coinflip.joiningRange);
    let maxRange = price + (price * config.coinflip.joiningRange);

    if (req.body.totalValue < minRange || req.body.totalValue > maxRange) {
        let error = new Error(`Game value range voilation. Current range is +/-${config.coinflip.joiningRange * 100}%. Your bid ${req.body.totalValue}, min range ${minRange}, max range ${maxRange} (CFJPRC02).`);
        error.httpStatusCode = 200;
        error.code = "JSONRES";
        next(error);
        return;
    }

    next();
}
