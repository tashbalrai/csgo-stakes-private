import Mysql from 'mysql';
import _ from 'lodash';
import config from './../../config/config.js';

const LIMIT = 10;

export default class Inventory {
    constructor(req, res) {
        this.request = req;
        this.response = res;
    }

    depositHistory() {
      let db = Mysql.createConnection(config.mysql);
      let page = Number(this.request.query.page);
      page = isFinite(page) ? page : 1;
      const skip = (page - 1) * LIMIT;
        // https://steamcommunity.com/tradeoffer/<offer_id>/

        db.query('SELECT * FROM deposit WHERE user_id = ? LIMIT ? OFFSET ?',
        [this.request.user.id, LIMIT, skip],
        (err, records) => {
            db.end();
            if (err) {
                console.log(err);
                
                this
                .response
                .status(500)
                .json({
                    "status": "error",
                    "response": "Unknown error occurred. Please try again later."
                })
                .end();
                return;
            }

            this
            .response
            .json({
                "status": "ok",
                "response": records
            })
            .end();
        });
    }

    withdrawHistory() {
      let db = Mysql.createConnection(config.mysql);
      let page = Number(this.request.query.page);
      page = isFinite(page) ? page : 1;
      const skip = (page - 1) * LIMIT;
        // TRADE LINK: https://steamcommunity.com/tradeoffer/<offer_id>/

        db.query("SELECT w.*, GROUP_CONCAT(JSON_OBJECT('id', i.id, 'mhash' ,i.mhash, 'image' , i.image, 'asset_id' , i.asset_id, 'rarity_color', i.rarity_color, 'rarity_tag_name', i.rarity_tag_name) SEPARATOR ',') as items FROM withdraw w LEFT JOIN withdraw_item wi ON(w.id = wi.withdraw_id) LEFT JOIN inventory i ON(wi.inventory_id = i.id) WHERE w.user_id = ? GROUP BY w.id LIMIT ? OFFSET ?",
        [this.request.user.id, LIMIT, skip],
        (err, records) => {
            db.end();
            if (err) {
                console.log(err);
                
                this
                .response
                .status(500)
                .json({
                    "status": "error",
                    "response": "Unknown error occurred. Please try again later."
                })
                .end();
                return;
            }

            this
            .response
            .json({
                "status": "ok",
                "response": records
            })
            .end();
        });
    }

    coinflipHistory() {
      let db = Mysql.createConnection(config.mysql);
      let page = Number(this.request.query.page);
      page = isFinite(page) ? page : 1;
      const skip = (page - 1) * LIMIT;

      db.query(`
        select g.id, g.game_winner, g.game_value, g.game_hash, g.game_secret, g.game_winage, g.created_at, g.state, i.id as inventory_id, i.mhash, i.image, i.rarity_color, i.user_id as item_owner
        from game_player p
        inner join game g on g.id = p.game_id
        inner join game_inventory gi on gi.game_id = p.game_id
        inner join inventory i on i.id = gi.inventory_id
        where p.user_id = ? and g.state in (4, 6) LIMIT ? OFFSET ?
      `, [this.request.user.id, LIMIT, skip], (err, rows) => {
        db.end();
        if (err) {
          console.log(err);

          this
            .response
            .status(500)
            .json({
              "status": "error",
              "response": "Unknown error occurred. Please try again later."
            })
            .end();
          return;
        }

        const grouped = _.groupBy(rows, 'id');

        const games = _.keys(grouped).map(key => {
            const items = grouped[key];
            const game = _.pick(items[0], ['game_value', 'id', 'created_at', 'game_winner', 'game_value', 'state', 'game_hash', 'game_secret', 'game_winage']);

            game.isWinner = game.game_winner == this.request.user.id;
            game.expired = game.state == 6;
            game.items = [];
            _.forEach(items, i => {
                const item = {
                  mhash: i.mhash,
                  image: i.image,
                  rarity_color: i.rarity_color,
                  id: i.inventory_id,
                  item_owner: i.item_owner
                };

                game.items.push(item);
            });

            return game;
        });

        this
          .response
          .json({
            "status": "ok",
            "response": games
          })
          .end();
      });
    }
}