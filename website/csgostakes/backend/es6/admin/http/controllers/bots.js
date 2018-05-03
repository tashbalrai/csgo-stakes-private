"use strict";

import mysql from  'mysql';
import Redis from 'redis';
import config from './../../config/config.js';

export default class Index {
    constructor(req, res) {
        this.request = req;
        this.response = res;
        this.data = {};
    }

    list() {
        let success = this.request.session.success;
        this.request.session.success = undefined;

        let error = this.request.session.error;
        this.request.session.error = undefined;

        let input = {"baseUrl": config.adminBaseUrl};

        if (success && success.length > 0) {
            input['success'] = success;
        }
        
        let con = mysql.createConnection(config.mysql);
        
        con.query('SELECT * FROM bot', (err, result) => {
            if (err!=null) {
                throw err;
                return;
            }

            input['data'] = {
                "content": "content/list_bot.ejs",
                "title": "Bots List"
            };

            input['record'] = result;

            if(result.length) {
              let client = Redis.createClient(config.redis);
              const keys = result.map(r => `botstats.${r.account_name}.${r.id}`);

              client.mget.apply(client, [...keys, (err, resp) => {
                client.quit();
                if (resp) {
                  const stats =  resp;
                  result.forEach((bot, idx) => {
                      bot.stats = JSON.parse(stats[idx]);
                  });
                }
                this.response.render('main', input);
                con.end();
              }]);
            } else {
              this.response.render('main', input);
              con.end();
            }
        });
        
        
    }

    view() {
        let error = this.request.session.error;
        this.request.session.error = undefined;
        
        let botId = null;
        
        if (this.request.params.botId) {
            botId = this.request.params.botId.trim();
        }
        
        let input = {
            "data": {
                "content": "content/add_bot.ejs",
                "title": "Add New Bot Account"
            },
            "baseUrl": config.adminBaseUrl
        };

        if (error && error.length > 0) {
            input['error'] = error;
        }

        if (botId) {
            input['data']['title'] = "Edit Bot Account";
            let con = mysql.createConnection(config.mysql);

            con.query('SELECT * FROM bot WHERE id = ?', [botId], (err, result) => {
                if (err) {
                    throw err;
                    return;
                }

                input['record'] = result[0];
                this.response.render('main', input);
                con.end();
            });
        } else {
            this.response.render('main', input);
        }

        
    }

    save() {
        if (this.request.body && this.request.body.save) {
            if (this.validateBotEntry()) {
                let con = mysql.createConnection(config.mysql);
                let id = null;

                if (this.request.body.id && this.request.body.id.length > 0) {
                    id = this.request.body.id;
                }

                let record = {
                    "account_name": this.request.body.account_name.trim(),
                    "password": this.request.body.account_password,
                    "shared_secret": this.request.body.shared_secret.trim(),
                    "identity_secret": this.request.body.identity_secret.trim(),
                    "steam_id": this.request.body.steam_id.trim(),
                    "host": this.request.body.host.trim(),
                    "state": (this.request.body.state == "on")? 1 : 0,
                    "bot_type": (this.request.body.state == "on")? 2 : 1
                };

                if (id) {
                    con.query('UPDATE bot SET ? WHERE id = ?', [record, id], (err, result) => {
                        con.end();
                        this.request.session.success = "Bot updated successfully.";
                        this.response.redirect(config.adminBaseUrl + '/bots');                        
                    });
                } else {
                    con.query('INSERT INTO bot SET ?', record, (err, result) => {
                        con.end();
                        this.request.session.success = "Bot added successfully.";
                        this.response.redirect(config.adminBaseUrl + '/bots');
                    });
                }
                
            } else {
                if (this.request.body.id) {
                    this.response.redirect(config.adminBaseUrl + '/bots/edit/' + this.request.body.id);
                } else {
                    this.response.redirect(config.adminBaseUrl + '/bots/new');
                }
            }
        }
    }

    validateBotEntry() {
        let error = [];
        if (typeof this.request.body.account_name == 'undefined' || this.request.body.account_name.length < 5 ) {
            error[error.length] = 'Steam account name is missing or not valid.';
        }

        if (typeof this.request.body.account_password == 'undefined' || this.request.body.account_password.length < 5) {
            error[error.length] =  'Steam account password is missing or not valid.';
        }

        if (typeof this.request.body.steam_id == 'undefined' || this.request.body.steam_id.length < 5) {
            error[error.length] =  'Steam ID is missing or not valid.';
        }

        if (typeof this.request.body.steam_id == 'undefined' || this.request.body.steam_id.length > 20) {
            error[error.length] =  'Steam ID length is out of range (20 characters max.).';
        }

        if (typeof this.request.body.shared_secret == 'undefined' || this.request.body.shared_secret.length < 5) {
            error[error.length] =  'Shared secret is missing or not valid.';
        }

        if (typeof this.request.body.identity_secret == 'undefined' || this.request.body.identity_secret.length < 5) {
            error[error.length] =  'Identity secret is missing or not valid.';
        }

        if (typeof this.request.body.host == 'undefined' || this.request.body.host.length < 7) {
            error[error.length] =  'Host IP address is missing or not valid.';
        }

        if (error.length > 0) {
            this.request.session.error = error;
            return false;
        } else {
            return true;
        }
    }

    remove() {
        let botId = null;
        if (this.request.params.botId) {
            botId = this.request.params.botId;
        }
    }

    pause() {
      let client = Redis.createClient(config.redis);
      const { id } = this.request.params;

      console.log(JSON.stringify({botId: id, event:"pause"}));
      client.on('ready', () => {
        client.publish('admin.message', JSON.stringify({botId: id, event:"pause"}), (err, result) => {
            client.quit();
            console.log(err, result);
            this.response.redirect(config.adminBaseUrl + '/bots');
        });
      });      
    }

    resume() {
        let client = Redis.createClient(config.redis);
        const { id } = this.request.params;
  
        console.log(JSON.stringify({botId: id, event:"resume"}));
        client.on('ready', () => {
          client.publish('admin.message', JSON.stringify({botId: id, event:"resume"}), (err, result) => {
              client.quit();
              console.log(err, result);
              this.response.redirect(config.adminBaseUrl + '/bots');
          });
        }); 
    }

    activate() {
        let client = Redis.createClient(config.redis);
        const { id } = this.request.params;
  
        console.log(JSON.stringify({botId: id, event:"activate"}));
        client.on('ready', () => {
          client.publish('admin.message', JSON.stringify({botId: id, event:"activate"}), (err, result) => {
              client.quit();
              console.log(err, result);
              this.response.redirect(config.adminBaseUrl + '/bots');
          });
        });
    }

    deactivate() {
        let client = Redis.createClient(config.redis);
        const { id } = this.request.params;
  
        console.log(JSON.stringify({botId: id, event:"deactivate"}));
        client.on('ready', () => {
          client.publish('admin.message', JSON.stringify({botId: id, event:"deactivate"}), (err, result) => {
              client.quit();
              console.log(err, result);
              this.response.redirect(config.adminBaseUrl + '/bots');
          });
        });
    }
}
