'use strict';

import config from './config.js';
import mysql from 'mysql';
import redis from 'redis';
import cluster from 'cluster';
import Debug from 'debug';
import winston from 'winston';
import os from 'os';

const
    sub = redis.createClient(config.redis),
    debug = Debug('bot:mgr'),
    ifaces = os.networkInterfaces();

let
    bots = {},
    logger = null,
    LUBI = 0;;

logger = new (winston.Logger)({
    transports: [
        new (winston.transports.File)({
            filename: '../log/trace.log',
            maxsize: 1048576
        })
    ]
});

class Control {
    constructor() {
        debug('Master control initialized.');
        cluster.setupMaster({
            exec: "bot.js"
        });
    }

    getBotList(botId) {
        return new Promise((resolve, reject) => {
            let host = [];

            Object.keys(ifaces).forEach(function (ifname) {
                let alias = 0;
                
                ifaces[ifname].forEach(function (iface) {
                    if ('IPv4' !== iface.family || iface.internal !== false) {
                    // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                    return;
                    }
                
                    if (alias >= 1) {
                    // this single interface has multiple ipv4 addresses
                    host.push(iface.address);
                    } else {
                    // this interface has only one ipv4 adress
                    host.push(iface.address);
                    }
                    ++alias;
                });
            });

            if (!host || host.length <= 0) {
                logger.error('Error cannot get host IP address.');
                debug('Error cannot get host IP address.');
                return;
            }

            let 
                db = mysql.createConnection(config.mysql),
                SQL = 'SELECT * FROM bot WHERE state = 1 AND host IN ? ',
                params = [[host]];
            
            if (botId && isFinite(botId)) {
                SQL += ' AND id = ? ';
                params.push(botId);
            }
            
            db.query(SQL, params, (err, rawList) => {
                db.end();

                if (err) {
                    logger.error('Error getting bot list from DB.', err);
                    reject(err);
                    return;
                }

                if (!rawList || rawList.length <= 0) {
                    logger.warn(`No bots found for host (${host.join(',')}).`);
                    reject(new Error(`No bots found for host (${host.join(',')}).`));
                    return;
                }

                for(let i=0; i<rawList.length; i++) {
                    if (typeof bots[rawList[i].id] == 'undefined') {
                        bots[rawList[i].id] = {};
                        bots[rawList[i].id].data = rawList[i];
                    }                        
                }
                resolve(rawList);
            });
        });        
    }

    forkBot(botId) {
        if (!botId) {
            throw new Error('Bot ID is required to fork it.');
            return;
        }

        if (typeof bots[botId] == 'undefined') {
            throw new Error(`No bot registered with bot ID . ${botId}`);
            return;
        }

        if (bots[botId].process) {
            throw new Error(`A bot with bot ID ${botId} is already running.`);
            return;
        }

        debug(`Forking bot (${botId}, ${bots[botId].data.account_name})`);
        logger.info(`Forking bot (${botId}, ${bots[botId].data.account_name})`);

        bots[botId].process = cluster.fork({
            bot: JSON.stringify(bots[botId].data)
        });
        
        bots[botId].process.on('exit', (code, signal) => {
            if (typeof bots[botId] != 'undefined') {
                debug(`Bot (${botId}) process aported.`);
                logger.warn(`Bot (${botId}) process aborted.`);
                
                let client = redis.createClient(config.redis);
                client.on('ready', () => {
                    client.del('botstats.' + bots[botId].data.account_name + '.' + bots[botId].data.id, (err, result) => {
                        client.quit();
                    });
                });
                delete bots[botId].process;
                setTimeout(this.forkBot.bind(this), 0, botId);
            } else {
                debug(`Bot (${botId}) exited normally.`);
                logger.warn(`Bot (${botId}) exited normally.`);
            }            
        });

        bots[botId].process.on('online', () => {
            debug(`Bot %s is online now`, bots[botId].data.account_name);
            let client = redis.createClient(config.redis);
            client.on('ready', () => {
                client.set('botstats.' + bots[botId].data.account_name + '.' + bots[botId].data.id, JSON.stringify({
                    "state": 1,
                    "inventory": -1,
                    "id": botId,
                    "type": bots[botId].data.bot_type
                }), (err, result) => {
                    client.quit();
                });
            });
            
        });

        bots[botId].process.on('message', this.handleBotMessage.bind(this));

        return true;
    }

    handleBotMessage(msg) {
        switch(msg.to) {
            case "master.itemscount":
                if (msg.botId && typeof bots[msg.botId] != 'undefined') {
                    bots[msg.botId].data.inventoryCount = Number(msg.inventoryCount);
                    debug('Bot %s has total %s items.', bots[msg.botId].data.account_name, bots[msg.botId].data.inventoryCount);
                }
                break;
            case "notifier":
                // console.log(JSON.stringify(msg));
                let client = redis.createClient(config.redis);
                client.on('ready', () => {
                    client.publish('notifier.message', JSON.stringify(msg), (err, result) => {
                        client.quit();
                    });
                });
                break;
        }
    }

    killBot(botId) {
        if (!botId) {
            throw new Error('Bot ID is required to kill it.');
            return;
        }

        debug(`Killing bot (${botId}, ${bots[botId].data.account_name})`);
        logger.info(`Killing bot (${botId}, ${bots[botId].data.account_name})`);

        let bot = bots[botId];
        delete bots[botId];

        bot.process.send({
            "event": "shutdown",
        });

        bot.process.disconnect();

        setTimeout(() => {
            if (bot.process.isDead()) {
                return;
            }

            bot.process.kill();
        }, config.bot.tradeOffersShutdownWaiting + 5000);
    }

    activateBot(botId) {
        this
        .getBotList(botId)
        .then(list => {
            if (typeof bots[botId] != 'undefined' && bots[botId].data) {
                debug('Activating the bot(%s).', botId);
                this.forkBot(botId);
            }
        })
        .catch(e => {
            debug('Error activating the bot (%s). %s', botId, e.message);
        });
    }
}

const control = new Control();

control
.getBotList()
.then(list => {
    for(let botId in bots) {
        control.forkBot(botId);
    }
})
.catch(e => {
    debug(e.message);
});

// Redis subscriber code.
sub.on('ready', () => {
    sub.subscribe('admin.message');
});

sub.on('subscribe', (channel, count) => {
    debug('Subscibed to channel %s, count %s', channel, count);
});

sub.on('message', (channel, message) => {
    let msg = null;

    try {
        msg = JSON.parse(message);
    } catch (e) {
        debug('Error parsing message from %s. Error: %s', channel, e.message);
        logger.error(`Error parsing message from ${channel}. Error: ${e.message}`, message);
        return;
    }

    switch (msg.event) {
        case 'pause':
            if (msg.botId && typeof bots[msg.botId] != 'undefined') {
                bots[msg.botId].process.send({
                    'event': 'pause'
                });

                bots[msg.botId].data.pause = true;
            } else if (!msg.botId) {
                for (let botId in bots) {
                    bots[botId].process.send({
                        'event': 'pause'
                    });
                    bots[botId].data.pause = true;
                }
            }
            break;
        case 'resume':
            if (msg.botId && typeof bots[msg.botId] != 'undefined') {
                bots[msg.botId].process.send({
                    'event': 'resume'
                });

                bots[msg.botId].data.pause = false;
            } else if (!msg.botId) {
                for (let botId in bots) {
                    bots[botId].process.send({
                        'event': 'resume'
                    });

                    bots[botId].data.pause = false;
                }
            }
            break;
        case 'deactivate':
            if (typeof bots[msg.botId] != 'undefined' && !bots[msg.botId].process.terminating) {
                let client = redis.createClient(config.redis);
                client.on('ready', () => {
                    client.del('botstats.' + bots[msg.botId].data.account_name + '.' + bots[msg.botId].data.id, (err, result) => {
                        client.quit();
                        bots[msg.botId].process.terminating = true;
                        control.killBot(msg.botId);
                    });
                });
            }
            break;
        case 'activate':
            if (typeof bots[msg.botId] == 'undefined') {
                control.activateBot(msg.botId);
            }
            break;
        case 'deposit-resolver':
            if (msg.botId && typeof bots[msg.botId] != 'undefined') {
                bots[msg.botId].process.send(msg);
            } 
            break;
        default:
            debug('Invalid event (%s) from channel (%s).', msg.event, channel);
            logger.warn(`Invalid event ${msg.event} from channel ${channel}`);
            break;
    }    
});
