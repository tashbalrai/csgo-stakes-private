export default {
  "loaded": "local",
  "numWorkers": 1,
  "baseUrl": "http://first.loc:4080",
  "host": "127.0.0.1",
  "port": 4080,
  "redis": {
    "host": "localhost",
    "port": 6379
  },
  "passport": {
    "steam": {
      "returnURL": "http://second.loc:4080/slbp/return",
      "realm": "http://second.loc:4080/slbp/",
      "apiKey": "731589D19D5D5EA18889226E6A994510",
      "launchURL": "http://first.loc:4080/slbp/bridge/?token="
    }
  },
  "apiToken": {
    "prefix": "STKN:",
    "ttl": 43200,
    "salt": "NVIInekw1tXJMCob"
  },
  "mysql": {
    "host": "localhost",
    "user": "vince",
    "password": "balrai",
    "database": "csgostakes",
    "port": "3306"
  },
  "steamlyticsAPIKey": "289b19d74bc9e22b396aebf978fcace9",
  "steamlyticsCacheKey": "steamlytics.pricelist",
  "inventory": {
    "minItemPrice": 0.10,
    "refreshRateLimit": 30 //in seconds
  },
  "withdraw": {
    "rateLimit": 30 //seconds
  },
  "chat": {
    "messageRateLimit": 5 //second
  },
  "consoles": {
    "intervals": {
      "steamlytics": 21600 //seconds
    }
  }

}
