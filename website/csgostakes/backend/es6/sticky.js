import express from 'express';
import http from 'http';
import https from 'https';
import sticky from 'sticky-session';
import fs from 'fs';
import socketio from 'socket.io';
import socketioRedis from 'socket.io-redis';
import session from 'express-session';
import ConnectRedis from 'connect-redis';
import helmet from 'helmet';
import config from './config/config.js';
import bundles from './bundles.js';
import consoles from './console/consoles.js';
import winston from 'winston';

console.log(`Configuration loaded is ${config.loaded}`);

const app = express();

let server = null;
if (config.SSL && fs.existsSync(config.SSLCert.key)) {
  console.log('Using SSL server.');
  server = https.createServer({
    "key": fs.readFileSync(config.SSLCert.key),
    "cert": fs.readFileSync(config.SSLCert.cert)
  }, app);
} else {
  server = http.createServer(app);
}
  
if (!sticky.listen(server, config.port, {
    "workers": config.numWorkers
  })) {
    // Master code
    server.once('listening', function() {
        console.log(`server started on ${config.port} port`);
    });
    
    consoles();
} else {
    console.log(`Worker PID: ${process.pid}`)
    
    // Worker code
    const io = socketio(server);
    const RedisStore = ConnectRedis(session);
  
    let redisCreds = {
      host: config.redis.host,
      port: config.redis.port
    };
  
    if (config.redis.password) {
      redisCreds["pass"] = config.redis.password;
    }
    
    const sessionMiddleware = session({
      secret: 'gabby and peeter',
      name: 'gapsid',
      resave: false,
      saveUninitialized: false,
      store: new RedisStore(redisCreds)
    });

    io.adapter(socketioRedis(config.redis));
  
    //Add helmet middleware for security related headers settings
    app.use(helmet());
  
    app.use(sessionMiddleware);
  
    // Add socket io to request object.
    app.use((req, res, next) => {
      req.io = io;
      next();
    });
  
    const log = new (winston.Logger)({
        transports: [
            new (winston.transports.File)({
                filename: __dirname + './../logs/web_error.log',
                maxsize: 1048576
            })
        ]
    });
    
    bundles.include(app, io);
  
    app.use((err, req, res, next) => {
      log.error(err.message, err);
    });
}