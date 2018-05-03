'use strict';

export default {
    "site": "CSGOSTAKES",
    "redis": {
        "host": "localhost",
        "port": 6379
    },
    "mysql": {
        "host": "localhost",
        "user": "vince",
        "password": "balrai",
        "database": "csgostakes",
        "port": "3306"
    },
    "bot": {
        "proxyPort": 15001,
        "proxyHost": "163.172.48.109",
        "redisKey": "steam.bot.accounts",
        "apiKey": "60861A63A0A7D15191D2FDBB0DFC9DEC",
        "pollInterval": 10000,
        "confirmationCheckerInterval": 15000,
        "cancelInterval": 300000,
        "pendingCancelInterval": 300000,
        "domain": "localhost",
        "retryCount": 5,
        "retryInterval": 5000,
        "retryIntervalList": [5, 60, 180, 300, 600, 900, 900],
        "depositFetchInterval": 5000,
        "withdrawFetchInterval": 5000,
        "tradeOffersShutdownWaiting": 10000
    },
    "fetchInterval": 10000,
    "assignmentStartDelay": 10000
};


