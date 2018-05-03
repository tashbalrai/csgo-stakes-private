import Redis from 'redis';

const redis = Redis.createClient({
    "host": "",
    "port": 8441,
    "password": ""
});

redis.on('ready', () => {
    redis.hget('steamlytics.pricelist', 'SCAR-20 | Green Marine (Well-Worn)', (err, item) => {
        console.log(err, item);
        item = JSON.parse(item);
        item.safe_price = 0.45;
        redis.hset('steamlytics.pricelist', 'SCAR-20 | Green Marine (Well-Worn)', JSON.stringify(item), (err, result) => {
            console.log(err, result);
            redis.quit();
        });
    });
});