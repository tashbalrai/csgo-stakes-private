import config from './../config/config';
import Redis from 'redis';

export default function (req, res, next) {
    if (!req.body.game_id) {
        let error = new Error("Game ID is required to load game (LGFR01).");
        error.httpStatusCode = 400;
        error.code = "JSONRES";
        next(error);
        return;
    }

    let redis = Redis.createClient(config.redis);

    redis.on('ready', () => {
        redis.hget(config.coinflip.cacheKey, `coinflip.${req.body.game_id}`, (err, game) => {
            if (err) {
                let error = new Error("Unknown error occurred. Please try again later (LGFR02).");
                error.internalError = err;
                error.httpStatusCode = 500;
                error.code = "JSONRES";
                next(error);
                return;
            }

            if (!game) {
                let error = new Error("Requested game not found (LGFR03).");
                error.httpStatusCode = 200;
                error.code = "JSONRES";
                next(error);
                return;
            }

            try {
                game = JSON.parse(game);
            } catch(e) {
                console.log(e);
                let error = new Error("Game parse error. Please try again later (LGFR04).");
                error.internalError = e;
                error.httpStatusCode = 500;
                error.code = "JSONRES";
                next(error);
                return;
            }

            //Joinee cannot be same as game creator
            if (game.owner.id == req.user.id) {
                let error = new Error("You cannot play against yourself (LGFR05).");
                error.httpStatusCode = 500;
                error.code = "JSONRES";
                next(error);
                return;
            }

            req.body.game = game;
            next();
        });
    });
}
