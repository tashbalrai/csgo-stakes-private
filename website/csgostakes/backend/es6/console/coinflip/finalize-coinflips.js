import config from './../../coinflip/config/config.js';
import Redis from 'redis';
import Mysql from 'mysql';
import moment from 'moment';

export default class FinalizeCoinflips {
  constructor(log) {
    this.log = log;
  }
   
  loadGamesFromRedis() {
    return new Promise((resolve, reject) => {
      let redis = Redis.createClient(config.redis);
      redis.on('ready', () => {
        redis.hgetall(config.coinflip.cacheKey, (err, rGames) => {
          redis.quit();
          if (err) {
            reject(err);
            return;
          }

          let games = [];
          for(let key in rGames) {
            try {
              games.push(JSON.parse(rGames[key]));
            } catch (e) {
              console.log(`Game with key (${key}) got JSON parse error.`);
              this.log.error(`FinalizeCoinflips: Game with key (${key}) got JSON parse error.`, e);
            }
          }
          
          resolve(games);
        });
      });
    });
  }

  checkIfWinnersCalculated() {
    this
    .loadGamesFromRedis()
    .then(games => {
      (function loop(i, max, done) {
        if (i < max) {
          new Promise((resolve, reject) => {
            // put 8 seconds delay in winner items assignment so winner do not get items immediately.
            if (games[i].state != config.coinflip.states.winnerCalculated
                || moment().isBefore(moment(games[i].winTime).add(8, 'seconds'))
              ) {
              loop.call(this, i+1, max, done);
              return;
            }

            this
            .finalizeGame(games[i])
            .then(gResult => {

              let redis = Redis.createClient(config.redis);
              redis.on('ready', () => {
                redis.publish('notifier.message', JSON.stringify({
                  "event": "broadcast",
                  "subEvent": "game.finalized",
                  "data": {game: games[i]}
                }), (err, result) => {
                    redis.quit();

                    if (err) {
                        this.log.error(`Coinflip: Cannot send game (${games[i].id}) finalize notification.`, err);
                        console.log(err);
                    }
                });
              });

              resolve(true);
            })
            .catch(err => {
              reject(err);
            });            
          })
          .then(result => {
            console.log(`FinalizeCoinflips: GameID (${games[i].id}) Finalized.`);
            loop.call(this, i+1, max, done)
          })
          .catch(err => {
            this.log.error('FinalizeCoinflips: Error: ', err);
            loop.call(this, i+1, max, done)
          })          
        } else {
          done();
        }
      }.bind(this))(0, games.length, () => {
          // console.log(`FinalizeCoinflips: Done:Fetching next game.`);
          setTimeout(this.checkIfWinnersCalculated.bind(this), 5000);
      });
    })
    .catch(err => {
      this.log.error(`FinalizeCoinflips: Error: loading games from redis.`, err);
      setTimeout(this.checkIfWinnersCalculated.bind(this), 5000);
    });
  }

  finalizeGame(game) {
    return new Promise((resolve, reject) => {
      this
      .calculateCommission(game)
      .then(result => {
        let redis = Redis.createClient(config.redis);
        redis.on('ready', () => {
          redis.hdel(config.coinflip.cacheKey, `coinflip.${game.id}`, (err, dResult) => {
            redis.quit();

            if (err) {
              console.log(err);
              this.log.error(`FinalizeCoinflips: Unable to remove game from redis.`, err);
            }
          });
        });
        resolve(result);
      })
      .catch(err => {
        reject(err);
        this.log.error(`FinalizeCoinflips: CalculateCommission: `, err);
      });
    });
  }

  calculateCommission(game) {
    return new Promise((resolve, reject) => {
      let totalItems = [];
      for(let i=0; i<game.owner.items.length; i++) {
        totalItems.push(game.owner.items[i]);
      }

      for(let i=0; i<game.joinee.items.length; i++) {
        totalItems.push(game.joinee.items[i]);
      }

      totalItems = totalItems.sort((item1, item2) => {
        return (item2.price.safe_price - item1.price.safe_price);
      });

      let comValue = Number(game.totalValue * config.coinflip.commission);
      let comItems = [];

      for(let i=0; i<totalItems.length; i++) {
        if (Number(totalItems[i].price.safe_price) <= comValue) {
          comItems.push(totalItems[i]);
          comValue -= Number(totalItems[i].price.safe_price);
          totalItems.splice(i, 1);
        }
      }

      this
      .assignWinnerItems(game, totalItems)
      .then(wResult => {
        if (comItems.length > 0) {
          this
          .assignCommissionItems(game, comItems)
          .then(cResult => {
            resolve(true);
          })
          .catch(err => {
            console.log(err);
            reject(err);
          });
        } else {
          resolve(true);
        }
      })
      .catch(err => {
        console.log(err);
        reject(err);
      });
    });
  }

  assignWinnerItems(game, items) {
    return new Promise((resolve, reject) => {
      if (!game) {
        reject(new Error("Game object is required for winner items assignment."));
        return;
      }

      if (!Array.isArray(items) || items.length <= 0) {
        reject(new Error("Items must be an array and must not be empty."));
        return;
      }

      let itemIds = [];
      for(let i=0; i<items.length; i++) {
        itemIds.push(items[i].id);
      }

      let db = Mysql.createConnection(config.mysql);
      db.query('UPDATE inventory SET state = ?, user_id = ? WHERE id IN ? AND state = ?',
      [config.coinflip.itemStates.active, game.winner, [itemIds], config.coinflip.itemStates.inGame],
      (err, result) => {
        db.end();

        if (err) {
          reject(err);
          return;
        }

        resolve(result);
      });
    });
  }

  assignCommissionItems(game, items) {
    return new Promise((resolve, reject) => {
      if (!game) {
        reject(new Error("Game object is required for winner items assignment."));
        return;
      }

      console.log(config.coinflip.userRoles.commission);

      if (!Array.isArray(items) || items.length <= 0) {
        reject(new Error("Items must be an array and must not be empty."));
        return;
      }

      let SQL = 'SELECT u.id, u.profile_name, (SELECT COUNT(id) FROM inventory WHERE user_id = u.id AND state = ?) ';
      SQL += ' AS total_items FROM user u WHERE u.role_id= ? ';

      let db = Mysql.createConnection(config.mysql);
      db.query(SQL, 
      [config.coinflip.itemStates.active, config.coinflip.userRoles.commission],
      (err, accounts) => {
        
        if (err) {
          db.end();
          this.log.error(`FinalizeCoinflips: AssignCommissionItems: Unable to retrieve commission accounts. gameId: ${game.id}, items: ${JSON.stringify(itemIds)}.`, err);
          reject(err);
          return;
        }
        console.log(accounts);

        let account = null;
        for(let i=0; i<accounts.length; i++) {
          if (accounts[i].total_items > items.length) {
            account = accounts[i].id;
            break;
          }
        }

        if (!account) {
          account = accounts[0].id;
        }

        let itemIds = [];
        for(let i=0; i<items.length; i++) {
          itemIds.push(items[i].id);
        }

        db.query('UPDATE inventory SET state = ?, user_id = ? WHERE id IN ? AND state = ?',
        [config.coinflip.itemStates.active, account, [itemIds], config.coinflip.itemStates.inGame],
        (err, result) => {
          db.end();

          if (err) {
            this.log.error(`FinalizeCoinflips: AssignCommissionItems: Unable to set commission items ${JSON.stringify(itemIds)} gameId: ${game.id}.`, err);
            reject(err);
            return;
          }

          resolve(result);
        });
      });
    });
  }
}
