import crypto from 'crypto';
import config from './../../config/config.js';
import RedisToken from './../redis-token/redis-token.js';

export default function (socket, next) {
    if (!socket.handshake.headers.hasOwnProperty('x-access-token')) {
        next(new Error('Authentication unsuccessful.'));
        return;
    }

    if (!socket.handshake.headers.hasOwnProperty('x-user-sid')) {
        next(new Error('Authentication unsuccessful.')); //no user id provided.
        return;
    }

    const accessToken = socket.handshake.headers['x-access-token'];
    const sid = socket.handshake.headers['x-user-sid'];
    const ip = socket.client.request.headers['x-forwarded-for'] || socket.client.conn.remoteAddress;
    const token = new RedisToken();

    const ourToken = token.getToken(sid, ip);

    if (ourToken != accessToken) {
        // next(new Error('Authentication unsuccessful.')); //Wrong authentication
        next();
        return;
    }

    token
    .get(ourToken)
    .then(user => {
        if (user) {
            try {
                return JSON.parse(user);
            } catch (e) {
                // next(new Error('Authentication unsuccessful.')); // error occurred due to bad data.
                next();
            }
        }
    })
    .then(user => {
        if (!user) {
            // next(new Error('Authentication unsuccessful.')); //unauthorized
            next();
            return;
        }

        if (user && user.id != sid) {
            // next(new Error('Authentication unsuccessful.')); //unauthorized
            next();
            return;
        }
        socket.request.user = user;
        delete user.sessionId;
        delete user.token;
        
        socket.emit('auth/success', {
            "status": "ok",
            "response": user
        });
        next(); //Everything seems to be ok. Let's go ahead.
    })
    .catch(err => {
        console.log(err);
        next(new Error('Authentication unsuccessful.'));// error occurred due to bad request.
    });
}