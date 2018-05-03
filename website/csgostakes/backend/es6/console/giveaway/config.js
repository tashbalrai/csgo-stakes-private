import config from './../../config/config.js';

config.userRoles = {
    "normal": 1,
    "chatAdmin": 2,
    "commission": 3,
    "giveaway": 4
};

config.giveaway = {
    "perMinute": 5,
    "maxItemAmount": 0.11,
    "itemExpireTime": 4, //hours
    "states": {
        "active": 1,
        "announced": 2,
        "completed": 3,
        "expired": 4
    }
};

config.itemStates = {
    "inActive": 0,
    "active": 1,
    "locked": 2,
    "inGame": 3,
    "withdrawn": 4,
    "queuedForWithdraw": 5,

    "0": "Inactive",
    "1": "Active",
    "2": "Locked",
    "3": "In Game",
    "4": "Withdrawn",
    "5": "Queued for withdraw"
};

export default config;
  