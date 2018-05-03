import config from './../../../config/config.js';
import RedisToken from './../../../library/redis-token/redis-token.js';
import Mysql from 'mysql';
import Redis from 'redis';

export default class User {
  constructor(req, res) {
    this.request = req;
    this.response = res;
  }
  
  authenticate() {
    if (this.request.user) {
      delete this.request.user.token;
      delete this.request.user.sessionId;
      this.response.json(this.request.user);
    } else {
      this.response.json(null);
    }    
  }

  logoutAPI() {
    if (this.request.user) {
      let sessionId = this.request.user.sessionId;
      let redisToken = new RedisToken();
      redisToken
      .remove(this.request.user.token)
      .then(result => {
        let redis = Redis.createClient(config.redis);
        redis.on('ready', () => {
          //remove the session also to get in sync
          redis.del('sess:' + sessionId, (err, result) => {
            redis.quit();
            
            if (err) {
              console.log(err);
              this
              .response
              .status(500)
              .json({
                "status": "error",
                "response": "Unable to logout user try again later."
              });
              return;
            }

            this
            .response
            .json({
              "status": "ok",
              "response": "User logged out."
            });
          });
        });        
      })
      .catch(err => {
        console.log(err);
        this
        .response
        .status(500)
        .json({
          "status": "error",
          "response": "Unable to logout user try again later."
        });
      });
    }
  }

  logoutSession() {
    if (this.request.session.user) {
      let token = this.request.session.user.token;
      this.request.session.destroy();
      let redisToken = new RedisToken();
      redisToken
      .remove(token)
      .then(result => {
        this
        .response
        .redirect(config.baseUrl);
        return;
      })
      .catch(err => {
        console.log(err);
        this.response.json({
          "status": "error",
          "response": "Unable to logout user try again later."
        });
      });
    } else {
      this
      .response
      .redirect(config.baseUrl);
    }
  }

  updateTradeUrl() {
    if (!this.request.body.trade_url) {
      this
      .response
      .json({
        "status": "error",
        "response": "You must provide trade url of the user"
      })
      .end();
    }

    let tu = this.request.body.trade_url;
    let pattTradeUrl = /^https\:\/\/steamcommunity\.com\/tradeoffer\/new\/\?partner=(\d+)&token=([\w\d-]+)$/im;
    
    if (!pattTradeUrl.test(tu)) {
      this
      .response
      .json({
        "status": "error",
        "response": "Invalid trade url. (E.g: https://steamcommunity.com/tradeoffer/new/?partner=xxxx&token=xxxxx)"
      })
      .end();
      return;
    }

    let db = Mysql.createConnection(config.mysql);
    db.query('UPDATE user SET trade_url = ? WHERE id = ?', 
      [tu, this.request.user.id], 
      (err, result) => {
      db.end();
      
      if (err) {
        console.log(err);
        this
        .response
        .status(500)
        .json({
          "status": "error",
          "response": "Unknown error occurred"
        })
        .end();
        return;
      }

      this.request.user.trade_url = tu;
      let redisToken = new RedisToken();
      redisToken
      .set(this.request.user.token, this.request.user)
      .then(saved => {
        this
        .response
        .json({
          "status": "ok",
          "response": "Trade URL saved."
        })
        .end();
      })
      .catch(err => {
        console.log(err);
        this
        .response
        .status(500)
        .json({
          "status": "error",
          "response": "Unknown error occurred. Please try again later."
        })
        .end();
      });      
    });
  }

  getTradeUrl() {
    this
    .response
    .json({
      "status": "ok",
      "response": {
        "trade_url": this.request.user.trade_url
      }
    })
    .end();
    return;
  }

}