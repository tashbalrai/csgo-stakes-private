"use strict";

import crypto from 'crypto';
import mysql from  'mysql';
import config from './../../config/config.js';

export default class Index {
  constructor(req, res) {
    this.request = req;
    this.response = res;
    this.data = {};
  }
  
  index() {
    if (this.request.session.admin && this.request.session.admin.user) {
      this.response.redirect(config.adminBaseUrl + '/dashboard');
      return;
    } else {
      let error = null;
      if (this.request.session && this.request.session.admin && this.request.session.admin.error) {
        error = this.request.session.admin.error;
        this.request.session.admin = undefined;
      }
      this.response.render('login', {error, "baseUrl": config.adminBaseUrl});  
    }
  }

  dashboard() {
    this.response.render('main', { 
      "data": {
        "content": "content/dashboard.ejs",
        "title": "Dashbard"
      },
      "baseUrl": config.adminBaseUrl
    });
  }

  processLogin() {
    if (typeof this.request.body['submit'] != 'undefined') {
      
      let uname = this.request.body.uname.trim();
      let pword = this.request.body.pword.trim();
      let hash = crypto.createHash('sha256');
      hash.update(pword);
      let pwordHash = hash.digest('hex');

      let con = mysql.createConnection(config.mysql);
      con.query('SELECT * FROM admin_user WHERE username = ? AND password = ? LIMIT 1', [uname, pwordHash], (err, result) => {
        
        if (err != null) {
          console.log(err.stack);
          this.response.redirect(config.adminBaseUrl);
          return;
        }

        let user = result[0];
        if (user) {
          this.request.session.admin = {
            "user": user
          };

          this.response.redirect(config.adminBaseUrl + '/dashboard');
          return;
        } else {
          this.request.session.admin = {
            "error": {
              "message": "Invalid username and/or password."
            }
          }
          this.response.redirect(config.adminBaseUrl);
        }
      })
    }
  }
  
  logout() {
    this.request.logout();
    delete this.request.session.admin;
    this.response.redirect(config.adminBaseUrl);
  }
}