import config from './../../config/config.js';
import Redis from 'redis';

export default function(socket, next) {
    const user = socket.request.user;

    if(!user) {
        console.log('No user')
        return next(new Error('User not authenticated.'));
    }
 
    let redis = Redis.createClient(config.redis);
    redis.on('ready', () => {
        redis.get('ratelimit.chat.message.' + user.id, (err, data) => {
            if (err) {
                res
                .status(500)
                .end();
                return;
            }

            if (data == null) {
                redis.setex('ratelimit.chat.message.' + user.id,
                    config.chat.messageRateLimit,
                    Date.now(),
                    (err, result) => {
                        redis.quit();
                });
                next();
            } else {
                next(new Error('You are under rate limit'));
            }
        });
    });
}