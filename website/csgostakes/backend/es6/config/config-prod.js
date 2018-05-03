export default {
  "loaded": "prod",
  "baseUrl": "http://csgostakes.xyz",
  "SSL": true,
  "SSLCert": {
    "key": "",
    "cert": ""
  },
  "host": "45.32.159.135",
  "port": 80,
  "redis": {
    "host": "localhost",
    "port": 6379,
    "password": "@password1"
  },
  "passport": {
    "steam": {
      "returnURL": "http://csgostakes.trade/slbp/return",
      "realm": "http://csgostakes.trade/slbp/",
      "apiKey": "731589D19D5D5EA18889226E6A994510",
      "launchURL": "http://csgostakes.xyz/slbp/bridge/?token="
    }
  },
  "apiToken": {
    "prefix": "STKN:",
    "ttl": 43200,
    "salt": "NVIInekw1tXJMCob"
  },
  "mysql": {
    "host": "45.32.159.135",
    "user": "developer",
    "password": "dev@77",
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

};