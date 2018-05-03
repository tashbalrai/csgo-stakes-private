import mysql from  'mysql';
const knex = require('knex')({client: 'mysql'});
import config from './../../../config/config';
import rateLimiter from './../../../library/middlewares/chat-rate-limiter';

const conn = mysql.createConnection(config.mysql);

const COLS =[
  'chat.id',
  'chat.message',
  'chat.created_at',
  'chat.user_id',
  'user.profile_name',
  'user.avatar',
  'user.role_id',
  'user.steam_id'
];

conn.connect(err => {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }
  console.log('connected as id ' + conn.threadId);
});


export default class User {
  constructor(socket, ns) {
    if (typeof socket !== 'object') {
      throw new Error('Socket controller require a socket object.');
    }
    this.socket = socket;
    this.user = socket.request.user || null;
    this.ns = ns;
  }

  sendMessage(data) {
    // const { user } = this.socket;
    if(!this.user) return;

    if(!data.message || data.message.length > 250) {
      this.socket.emit('chat/messages/send/error', { error: `Invalid message content` });
    }

    rateLimiter(this.socket, (err) => {
      if(err) {
        this.socket.emit('chat/messages/send/error', { error: `Please wait ${config.chat.messageRateLimit} seconds before sending another message` });
        return;
      }

      conn.query(`select count(id) from game_player where user_id = ?`, [this.user.id], (err, resp) => {
        if(err) {
          this.socket.emit('chat/messages/send/error', { error: `Something went wrong.` });
          return;
        } else if (!resp[0]['count(id)']) {
          this.socket.emit('chat/messages/send/error', { error: `You must play at least one coinflip before being able to send chat` });
          return;
        }

        const userQ =knex('user').where({id: this.user.id}).toString();
        conn.query(userQ, (err, users) => {
          if(err) {
            this.socket.emit('chat/messages/send/error', { error: `Something went wrong` });
          } else {
            if (users[0].is_chat_banned) {
              this.socket.emit('chat/messages/send/error', { error: `You're banned from sending chat` });
            } else {
              const q = knex('chat').insert({
                user_id: this.user.id,
                message: data.message
              }).toString();

              conn.query(q, (err, resp) => {
                if (resp && resp.insertId) {
                  const q = knex('chat').select(COLS).leftJoin('user', 'chat.user_id', 'user.id').where({'chat.id': resp.insertId}).toString();
                  conn.query(q, (err, resp) => {
                    this.ns.emit('chat/messages/received', resp[0]);
                  })
                } else {
                  this.socket.emit('chat/messages/send/error', { error: err.message });
                }
              });
            }
          }
        });

      });
    });
  }

  getRecentMessages() {
    const q = knex('chat').select(COLS).leftJoin('user', 'chat.user_id', 'user.id').orderBy('chat.id', 'desc').limit(50).toString();
    conn.query(q, (err, rows) => {
      this.socket.emit('chat/messages', rows);
    });
  }

  banUser(user_id) {
    console.log(this.user.role_id)
    if(!this.user || this.user.role_id != 2) {
      this.socket.emit('chat/commands/error', {
        error: 'You do not have permission to run this command.'
      });
    }

    if(user_id == this.user.id) {
      this.socket.emit('chat/commands/error', {
        error: 'cannot ban self'
      });
    } else {
      const q =knex('user').where({id: user_id}).toString();
      conn.query(q, (err, rows) => {
        if (rows && rows.length) {
          const user = rows[0];
          const updateQ =knex('user').update({is_chat_banned: 1}).where({id: user_id}).toString();
          conn.query(updateQ, (err) => {
            if(!err) {
              this.ns.emit('chat/broadcasts/banned', {
                profile_name: user.profile_name,
                user_id
              });
            } else {
              this.socket.emit('chat/commands/error', {
                error: err.message
              });
            }
          });
        } else {
          this.socket.emit('chat/commands/error', {
            error: 'Error!'
          });
        }
      });
    }
  }
}