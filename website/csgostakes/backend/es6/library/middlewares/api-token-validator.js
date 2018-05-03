import crypto from 'crypto';
import config from './../../config/config.js';
import RedisToken from './../redis-token/redis-token.js';

export default function(req, res, next) {
  if (!req.headers.hasOwnProperty('x-access-token')) {
    res.sendStatus(401); //no access token provided.
    return;
  }
  
  if (!req.headers.hasOwnProperty('x-user-sid')) {
    res.sendStatus(401); //no steam id provided.
    return;
  }
  
  const accessToken = req.headers['x-access-token'];
  const sid = req.headers['x-user-sid'];
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const token = new RedisToken();
  
  const ourToken = token.getToken(sid, ip);
  
  if (ourToken !== accessToken) {
    res.sendStatus(401); //Wrong authentication
    return;
  }
  
  token.get(ourToken).then(user => {
    if (user) {
      try {
        return JSON.parse(user);
      } catch (e) {
        res.sendStatus(400); // error occurred due to bad data.
      }      
    }   
  }).then(user => {
    if (!user) {
      res.sendStatus(401); //unauthorized
      return;
    }

    if (user && user.id != sid) {
      res.sendStatus(401); //unauthorized
      return;
    }
    req.user = user;
    next(); //Everything seems to be ok. Let's go ahead.
  }).catch(err => {
    res.sendStatus(400); // error occurred due to bad request.
  });
}