import config from './../../config/config.js';
import Redis from 'redis';

export default function(req, res, next) {
    let token = req.user.token;
 
    let redis = Redis.createClient(config.redis);
    redis.on('ready', () => {
        redis.get('ratelimit.refresh.inv.' + token, (err, data) => {
            if (err) {
                console.log(err);
                res
                .status(500)
                .end();
                return;
            }

            if (data == null) {
                redis.setex('ratelimit.refresh.inv.' + token, 
                    config.inventory.refreshRateLimit,
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
                    "response": "You are under rate limit, wait " + config.inventory.refreshRateLimit + " seconds."
                })
                .end();
            }
        });
    });
}