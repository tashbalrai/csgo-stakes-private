import Mysql from 'mysql';
import _ from 'lodash';
import async from 'async';
const knex = require('knex')({client: 'mysql'});
import config from './../../config/config.js';


export default class Inventory {
    constructor(req, res) {
        this.request = req;
        this.response = res;
    }

    list() {
      let db = Mysql.createConnection(config.mysql);
      db.query('SELECT * FROM ticket WHERE user_id = ? ORDER BY created_at DESC',
        [this.request.user.id],
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

    get() {
      let db = Mysql.createConnection(config.mysql);

      async.waterfall([
        (cb) => {
          db.query(`
            select t.*, u.profile_name, u.avatar from ticket t
            inner join user u on u.id = t.user_id
            where t.id = ? and u.id = ?
          `, [this.request.params.id, this.request.user.id], (err, rows) => {
            if (err) {
              cb(err);
            } else {
              const t = rows[0];
              if(!t) {
                cb(new Error('Ticket not found'));
              } else {
                cb(null, t);
              }
            }
          });
        },
        (ticket, cb) => {
          db.query(`
            select r.*, u.profile_name, u.avatar from ticket_reply r 
              left join user u on u.id = r.user_id
              left join user u2 on u2.id = r.user_id
            where ticket_id = ?
          `, [this.request.params.id], (err, rows) => {
            if(err) {
              cb(err);
            } else {
              ticket.replies = rows;
              cb(null, ticket);
            }
          });
        }
      ], (err, ticket) => {
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
        } else {

          this
            .response
            .json({
              "status": "ok",
              "response": ticket
            })
            .end();
        }
      });
    }

    create() {
      const { subject, department, message } = this.request.body;
      let db = Mysql.createConnection(config.mysql);
      let fileName = null;

      if(this.request.files) {
        const file = this.request.files[0];
        if(file) fileName = file.filename;
      }

      db.query(`select * from ticket where user_id = ? and status in (?)`,
        [this.request.user.id, [config.ticketStatus.OPEN, config.ticketStatus.AWAITING_ADMIN_REPLY, config.ticketStatus.AWAITING_USER_REPLY]],
        (err, rows) => {
          if (err) {
            console.log(err)
            db.end();
            this
              .response
              .status(500)
              .json({
                "status": "error",
                "response": "Unknown error occurred. Please try again later."
              })
              .end();
            return;
          } else if (rows.length){
            db.end();
            this
              .response
              .status(500)
              .json({
                "status": "error",
                "response": "Another open ticket exists."
              })
              .end();
            return;
          }

          const q = knex('ticket').insert({
            subject,
            department,
            message,
            attachment: fileName,
            status: config.ticketStatus.OPEN,
            user_id: this.request.user.id
          }).toString();

          db.query(q, (err, resp) => {
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
                "response": resp
              })
              .end();

          });

        }
      );
    }

    reply() {
      let db = Mysql.createConnection(config.mysql);
      let fileName = null;
      console.log(this.request.files);
      console.log(this.request.body);

      if(this.request.files) {
        const file = this.request.files[0];
        if(file) fileName = file.filename;
      }

      const q = knex('ticket').where({id: this.request.params.id, user_id: this.request.user.id}).toString();

      db.query(q, (err, rows) => {
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
          db.end();
          return;
        }

        const record = rows[0];

        if(!record || record.status === config.ticketStatus.CLOSED) {
          this
            .response
            .status(500)
            .json({
              "status": "error",
              "response": "Ticket not found or closed."
            })
            .end();

          db.end();
          return;
        }

        const insertQ = knex('ticket_reply').insert({
          ticket_id: this.request.params.id,
          user_id: this.request.user.id,
          message: this.request.body.message,
          attachment: fileName
        }).toString();

        const updateQ = knex('ticket')
          .where({id: this.request.params.id, user_id: this.request.user.id})
          .update({status: config.ticketStatus.AWAITING_ADMIN_REPLY})
          .toString();

        db.beginTransaction((err) => {
          if (err) { throw err; }
          db.query(insertQ, (error, results, fields) => {
            if (error) {
              return db.rollback(function() {
                throw error;
              });
            }

            db.query(updateQ, (error, results, fields) => {
              if (error) {
                return db.rollback(function() {
                  throw error;
                });
              }

              db.commit((err) => {
                if (err) {
                  db.rollback(() => {
                    throw err;
                  });
                }

                db.end();
                this
                  .response
                  .json({
                    "status": "ok",
                    "response": results
                  })
                  .end();
              });
            });
          });
        });
      });
    }

    close() {
      let db = Mysql.createConnection(config.mysql);

      const q = knex('ticket')
        .where({id: this.request.params.id, user_id: this.request.user.id})
        .update({status: config.ticketStatus.CLOSED})
        .toString();

      db.query(q, (err, resp) => {
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
            "response": resp
          })
          .end();
      })

    }

}