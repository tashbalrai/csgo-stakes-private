import config from './../../config/config.js';

config.coinflip = {
    "cacheKey": "coinflip.cache.pool",
    "joiningRange": 0.20, // -5% to +5%
    "maxGameItems": 25,
    "minValue": 0.10,
    "commission": 0.08,
    "itemStates": {
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
    },
    "states": {
        "inactive": 0,
        "active": 1,
        "locked": 2,
        "joined": 3,
        "winnerCalculated": 4,
        "commissionCalculated": 5,
        "expired": 6,

        "0": "Inactive",
        "1": "Active",
        "2": "Locked",
        "3": "Joined",
        "4": "Winner calculated",
        "5": "Comission calculated",
        "6": "Expired"
    },
    "retryAttempt": 5,
    "userRoles": {
        "normal": 1,
        "chatAdmin": 2,
        "commission": 3
    }
};

export default config;
  