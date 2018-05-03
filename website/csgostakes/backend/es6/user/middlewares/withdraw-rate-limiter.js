import config from './../config/config';
import Redis from 'redis';

export default function(req, res, next) {
    let token = req.user.token;
 
    let redis = Redis.createClient(config.redis);
    redis.on('ready', () => {
        redis.get('ratelimit.withdraw.inv.' + token, (err, data) => {
            if (err) {
                console.log(err);
                res
                .status(500)
                .end();
                return;
            }

            if (data == null) {
                redis.setex('ratelimit.withdraw.inv.' + token, 
                    config.withdraw.rateLimit,
                    Date.now(),
                    (err, result) => {
                        redis.quit();
                });
                next();
            } else {
                res
                .status(429)
                .json({
                    "status": "error",
                    "response": "You are under rate limit, wait " + config.withdraw.rateLimit + " seconds."
                })
                .end();
            }
        });
    });
}