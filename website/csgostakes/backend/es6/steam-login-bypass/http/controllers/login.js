import config from './../../../config/config.js';
import RedisToken from './../../../library/redis-token/redis-token.js';
import Redis from 'redis';
import mysql from 'mysql';

export default class Login {
  constructor(req, res) {
    this.request = req;
    this.response = res;
  }
  
  loginResponse() {
    this.response.redirect(config.passport.steam.launchURL + (new Buffer(this.request.session.id)).toString('base64'));
    this.response.end();
    return;
  }

  bridgeSession() {
    let token = null;
    if (this.request.query.token) {
      let redis = Redis.createClient(config.redis);

      redis.on('ready', () => {
        token = this.request.query.token;
        if (token) {
          let sessId = new Buffer(token, 'base64').toString('ascii');
          redis.get('sess:' + sessId, (err, data) => {
            
            let session = null;
            try {
              session = JSON.parse(data);
            } catch(e) {
              console.log(e);
              redis.quit();

              this
              .response
              .redirect(config.baseUrl);
              return;
            }
            
            let user = {
              "profile_name": session.passport.user._json.personaname,
              "steam_id": session.passport.user._json.steamid,
              "profile_url": session.passport.user._json.profileurl,
              "avatar": session.passport.user._json.avatarfull,
              "role_id": 1,
              "avatar_medium": session.passport.user._json.avatarmedium
            };

            redis.del('sess:' + sessId, (err, result) => {
              redis.quit();
              if (err) {
                console.log(err);
              }
            });

            this
            .registerUser(user)
            .then(user => {
              user.sessionId = this.request.session.id;
              let redisToken = new RedisToken();
              redisToken
              .tokenize(user.id, this.getIP(), user)
              .then(token => {
                this.request.session.user = user;
                delete this.request.session.passport;
                // console.log(this.request.session.user);
                this.response.redirect(config.baseUrl);
              })
              .catch(err => {
                console.log(err);
                this
                .response
                .redirect(config.baseUrl);
                return;
              });
            })
            .catch(e => {
              this
              .response
              .redirect(config.baseUrl);
              return;
            });          
          });
        }
      });
      
    } else {
      this.response.redirect(config.baseUrl);
    }
  }

  registerUser(steamUser) {
    return new Promise((resolve, reject) => {
      let db = mysql.createConnection(config.mysql);
      let steamId = steamUser.steam_id;
      db.query('SELECT * FROM user WHERE steam_id = ?', [steamId], (err, user) => {
        if (err) {
          db.end();
          reject(err);
          return;
        }

        if (user.length < 1) {
          db.query('INSERT INTO user SET ?', steamUser, (err, result) => {
            if (err) {
              db.end();
              reject(err);
              return;
            }

            db.end();
            steamUser.id = result.insertId;
            resolve(steamUser);
            return;
          });
        } else {
          db.query('UPDATE user SET ? WHERE id = ?', [steamUser, user[0].id], (err) => {
            db.end();
            if (err) {
              reject(err);
              return;
            }
            resolve(user[0]);
          });
        }        
      });
    });
  }

  printSession() {
    this.response.send(this.request.session);
  }

  getIP() {
    let ip = this.request.headers['x-forwarded-for'] || this.request.connection.remoteAddress;
    return ip;
  }
}