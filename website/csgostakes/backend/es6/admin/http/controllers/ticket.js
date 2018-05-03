"use strict";

import mysql from  'mysql';
const knex = require('knex')({client: 'mysql'});
import config from './../../config/config.js';

const ticketStatus = {
  OPEN: 1,
  AWAITING_USER_REPLY: 2,
  AWAITING_ADMIN_REPLY: 3,
  CLOSED: 0
};

const FILTERS = {
  'new': [1, 3],
  'replied': [2],
  'closed': [0]
};

export default class Index {
  constructor(req, res) {
    this.request = req;
    this.response = res;
    this.data = {};
  }

  list() {
    const type = this.request.params.type;
    let success = this.request.session.success;
    this.request.session.success = undefined;

    let error = this.request.session.error;
    this.request.session.error = undefined;

    let input = {"baseUrl": config.adminBaseUrl};

    if (success && success.length > 0) {
      input['success'] = success;
    }

    let con = mysql.createConnection(config.mysql);

    con.query('SELECT ticket.*, user.profile_name FROM ticket LEFT JOIN user on(ticket.user_id = user.id) where ticket.status in (?) order by ticket.status asc', [FILTERS[type]], (err, result) => {
      if (err!=null) {
        console.log(err);
        throw err;
        return;
      }

      input['data'] = {
        "content": "content/list_tickets.ejs",
        "title": "Tickets List"
      };

      input['record'] = result;
      this.response.render('main', input);      
    });
  }

  view() {
    let error = this.request.session.error;
    this.request.session.error = undefined;

    let con = mysql.createConnection(config.mysql);
    const id = this.request.params.id;

    let input = {
      "data": {
        "content": "content/ticket_details.ejs",
        "title": "Ticket details"
      },
      "baseUrl": config.adminBaseUrl
    };

    if (error && error.length > 0) {
      input['error'] = error;
    }

    const q = `select t.*, u.profile_name,
      CAST(
         CONCAT('[',
            GROUP_CONCAT(JSON_OBJECT('id', r.id, 'user_id', r.user_id, 'user_name', uu.profile_name, 'message', r.message, 'attachment', r.attachment, 'created_at', r.created_at) ORDER BY r.created_at SEPARATOR ','),
         ']')
      as JSON  
      )  
      as replies from ticket as t 
      left join ticket_reply as r on(t.id = r.ticket_id)
      left join user as u on(t.user_id = u.id)
      left join user as uu on(r.user_id = uu.id)
      where t.id = ? group by t.id`;

    con.query(q, [id], (err, result) => {
      if (err) {
        throw err;
        return;
      }

      const data = result[0];

      data.replies = JSON.parse(data.replies).filter(r => r.id);

      input['record'] = data;
      this.response.render('main', input);
      con.end();
    });
  }

  save() {
    const { message } = this.request.body;
    let error = [];
    let fileName = null;

    if (message) {
      let db = mysql.createConnection(config.mysql);
      const q = 'SELECT * from ticket where id = ?';
      db.query(q, [this.request.params.id], (err, rows) => {
        if (err) {
          throw err;
        }

        const record = rows[0];

        if(!record || record.status === 0) {
          throw new Error('Ticket closed');
        }

        const insertQ = knex('ticket_reply').insert({
          ticket_id: this.request.params.id,
          user_id: this.request.session.admin.user.id,
          message: this.request.body.message,
          attachment: fileName
        }).toString();

        const updateQ = knex('ticket')
          .where({id: this.request.params.id})
          .update({status: ticketStatus.AWAITING_USER_REPLY})
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
                this.response.redirect(config.adminBaseUrl + '/tickets/' + this.request.params.id);
              });
            });
          });
        });
      });

    } else {
      this.response.redirect(config.adminBaseUrl + '/tickets/' + this.request.params.id);
    }
  }

  close() {
    const q = knex('ticket').where({id: this.request.params.id}).update({status: ticketStatus.CLOSED}).toString();
    let con = mysql.createConnection(config.mysql);
    con.query(q, (err, result) => {
      con.end();
      this.response.send('ok');
    })
  }
}