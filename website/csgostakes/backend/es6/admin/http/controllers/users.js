"use strict";

import mysql from  'mysql';
import async from 'async';
import config from './../../config/config.js';

const LIMIT = 20;

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
    const q = this.request.query.q || '';
    let page = Number(this.request.query.page);
    if(!isFinite(page)) page = 1;
    const offset = (page - 1) * LIMIT;

    let con = mysql.createConnection(config.mysql);

    const countQuery = `select count(id) from user where user.profile_name like ?`;

    async.parallel({
        count: (cb) => {
          con.query(countQuery, ['%'+q+'%'], (err, resp) => cb(err, resp))
        },
        query: (cb) => {
          con.query(`SELECT * FROM user where profile_name like ? LIMIT ? OFFSET ?`, ['%'+q+'%', LIMIT, offset], (err, resp) => cb(err, resp))
        }
      },
      (err, results) => {
        con.end();
        if (err!=null) {
          throw err;
          return;
        }

        const total = results.count[0]['count(id)'];

        input['data'] = {
          "content": "content/list_users.ejs",
          "title": "Users List",
          total: total,
          limit: LIMIT,
          page: page,
          pages: Math.floor(total/LIMIT),
          query: q
        };

        input['record'] = results.query;

        this.response.render('main', input);
      });
  }

  view() {
    let error = this.request.session.error;
    this.request.session.error = undefined;


    const userId = this.request.params.id;

    let input = {"baseUrl": config.adminBaseUrl};

    if (error && error.length > 0) {
      input['error'] = error;
    }

    let con = mysql.createConnection(config.mysql);

    async.parallel({
      deposits: (callback) => {
        //deposit history
        con.query('SELECT * FROM deposit WHERE user_id = ?',
          [userId], (err, result) => {
            callback(err, result);
          });
      },
      withdraws: (callback) => {
        // withdraw history
        con.query("SELECT w.*, GROUP_CONCAT(JSON_OBJECT('id', i.id, 'mhash' ,i.mhash, 'asset_id' , i.asset_id) SEPARATOR ',') as items FROM withdraw w LEFT JOIN withdraw_item wi ON(w.id = wi.withdraw_id) LEFT JOIN inventory i ON(wi.inventory_id = i.id) WHERE w.user_id = ? GROUP BY w.id",
          [userId], (err, result) => {
            callback(err, result);
          });
      },
      inventory: (callback) => {
        con.query("SELECT * from inventory i WHERE i.user_id = ? AND state = 1", [userId], (err, result) => {
          callback(err, result);
        });
      }
    }, (err, results) => {
      con.end();
      if(err) {
        console.log(err);
        throw err;
      }

      // console.log(results);

      input['record'] = results;

      this.response.render('content/user_details.ejs', input);
    });
  }
}