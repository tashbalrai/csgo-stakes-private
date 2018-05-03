import config from './../../config/config.js';

config.userRoles = {
    "normal": 1,
    "chatAdmin": 2,
    "commission": 3,
    "giveaway": 4
};

config.giveaway = {
    "perMinute": 2,
    "maxItemAmount": 0.11,
    "itemExpireTime": 6, //hours,
    "states": {
        "active": 1,
        "announced": 2,
        "completed": 3,
        "expired": 4
    }
}

export default config;
  