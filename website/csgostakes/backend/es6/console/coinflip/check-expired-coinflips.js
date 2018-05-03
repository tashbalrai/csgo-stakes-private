import config from './../../coinflip/config/config.js';
import Redis from 'redis';
import Mysql from 'mysql';
import moment from 'moment';

export default class CheckExpiredCoinflips {
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
              this.log.error(`Game with key (${key}) got JSON parse error.`, e);
            }
          }
          
          resolve(games);
        });
      });
    });
  }

  checkIfGameExpired() {
    this
    .loadGamesFromRedis()
    .then(games => {
      for(let i=0; i<games.length; i++) {
        if (games[i].state == config.coinflip.states.active && moment(games[i].expiresAt).isBefore(moment())) {
          setTimeout(this.markGameExpired.bind(this), 0, games[i]);
        } 
      }
    })
    .catch(err => {
      console.log(err);
      this.log.error(`CheckIfGameExpired: ${err}`);
    })
  }

  markGameExpired(game) {
    if (!game) {
      console.log('Game object is required to mark game expired.');
      this.log.error('Game object is required to mark game expired.');
      return;
    }

    this
    .updateGameState(game, config.coinflip.states.expired)
    .then(ugDone => {
      this
      .revertInventory(game)
      .then(riDone => {
        let redis = Redis.createClient(config.redis);
        redis.on('ready', () => {
          redis.hdel(config.coinflip.cacheKey, `coinflip.${game.id}`, (err, result) => {
            
            if (err) {
              redis.quit();
              console.log(err);
              this.log.error(`Unable to remove coinflip.${game.id} game.`, err);
              return;
            }

            this.log.error(`Game coinflip.${game.id} expired.`);
            redis.publish('notifier.message', JSON.stringify({
              "event": "broadcast",
              "subEvent": "game.expired",
              "data": { game }
            }), (err, pubResult) => {
              redis.quit();

              if (err) {
                console.log(err);
                this.log.error(`Notify expired game coinflip.${game.id} failed.`, err);
                return;
              }

              console.log(`Game ${game.id} expired notified.`);
            })
          });
        });
      })
      .catch(err => {
        console.log(err);
        this.log.error(`Unable to revert coinflip.${game.id} game.`, err);
      });
    })
    .catch(err => {
      console.log(err);
      this.log.error(`Unable to update game state for coinflip.${game.id} game.`, err);
    });
  }

  updateGameState(game, state) {
    return new Promise((resolve, reject) => {
      if (!game) {
        reject(new Error('Game object is required to update state.'));
        return;
      }

      if (!state) {
        reject(new Error('State is required to update state.'));
        return;
      }

      let db = Mysql.createConnection(config.mysql);
      db.query('UPDATE game SET state = ? WHERE id = ? AND game_hash = ? LIMIT 1', 
      [state, game.id, game.hash],
      (err, result) => {
        db.end();

        if (err) {
          reject(err);
          return;
        }

        resolve(result);
      })
    });
  }

  revertInventory(game) {
    return new Promise((resolve, reject) => {
      if (!game) {
        reject(new Error('Game object is required to update state.'));
        return;
      }

      let itemIds = [];
      for(let i=0; i<game.owner.items.length; i++) {
        itemIds.push(game.owner.items[i].id);
      }

      if (itemIds.length <= 0) {
        reject(new Error('Cannot find items to revert.'));
        return;
      }

      let db = Mysql.createConnection(config.mysql);
      db.query('UPDATE inventory SET state = ? WHERE id IN ? AND user_id = ? AND state = ?', 
      [config.coinflip.itemStates.active, [itemIds], game.owner.id, config.coinflip.itemStates.inGame],
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
}
