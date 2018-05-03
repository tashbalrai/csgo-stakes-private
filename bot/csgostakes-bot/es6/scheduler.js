'use strict';

import config from './config.js';
import mysql from 'mysql';
import redis from 'redis';
import Debug from 'debug';
import winston from 'winston';

const  debug = Debug('bot:scheduler');

let
    logger = new (winston.Logger)({
        transports: [
            new (winston.transports.File)({
                filename: '../log/scheduler.log',
                maxsize: 1048576
            })
        ]
    }),
    LUBI = 0;

class Scheduler {
    constructor() {
        this.assignBot();
    }
    getOnlineBots() {
        return new Promise((resolve, reject) => {
            let client = redis.createClient(config.redis);
            client.on('ready', () => {
                client.keys('botstats.*', (err, keys) => {
                    if (err) {
                        client.quit();
                        reject(err);
                        return;
                    }
    
                    client.mget(keys, (err, onlineBots) => {
                        client.quit();
                        if (err) {
                            reject(err);
                            return;
                        }
    
                        let eligibleBots = {};
    
                        for (let i=0; i<onlineBots.length; i++) {
                            let bot = null;
                            
                            try {
                                bot = JSON.parse(onlineBots[i]);
                            } catch(e) {
                                debug(e);
                                logger.error('Error parsing bot.', e);
                                continue;
                            }
    
                            if (bot.state == 1 && bot.inventory >= 0) {
                                eligibleBots[bot.id] = bot;
                            }
                        }
    
                        resolve(eligibleBots);
                    });
                });
            });
        });        
    }

    getDeposits() {
        return new Promise((resolve, reject) => {
            let db = mysql.createConnection(config.mysql);

            db.query('SELECT * FROM deposit WHERE state = 1 AND (bot_id IS NULL OR bot_id = 0)  ORDER BY id ASC LIMIT 20', 
            (err, result) => {
                if (err) {
                    db.end();
                    reject(err);
                    return;
                }

                resolve(result);
                db.end();
            });
        });
    }

    assignBot() {
        this
        .getOnlineBots()
        .then(eligibleBots => {
            if (Object.keys(eligibleBots).length <= 0) {
                debug('No bots are online.');
                return;
            }

            this
            .getDeposits()
            .then(deposits => {
                if (deposits.length <= 0) {
                    // logger.info('No deposit records.');
                    // debug('No deposit records.');
                    setTimeout(this.assignBot.bind(this), config.fetchInterval);
                    return;
                }
    
                for(let i=0; i<deposits.length; i++) {
                    let botId = this.getAvailableBot(deposits[i], eligibleBots);
                    if (botId === false) {
                        debug('No bots available.');
                        logger.warn('No bots available.');
                        continue;
                    }
    
                    deposits[i].botId = botId;
                }
    
                let db = mysql.createConnection(config.mysql);
    
                (function loop(i, max, done) {
                    if (i < max) {
                        new Promise((resolve, reject) => {
                            let deposit = deposits[i];
    
                            if (!deposit.botId) {
                                reject(deposit);
                            }
    
                            db.query('UPDATE deposit SET bot_id = ? WHERE id = ?', [deposit.botId, deposit.id], (err, result) => {
                                if (err) {
                                    logger.error('Error deposit update failed.', err);
                                    debug('Error deposit update failed. error(%s).', err.message);
                                    reject(deposit);
                                    return;
                                }
    
                                resolve(deposit);
                            });
                        })
                        .then(dep => { 
                            logger.info(`Deposit (${dep.id}) assigned bot(${dep.botId}).`);
                            debug('Deposit (%s) assigned bot(%s).', dep.id, dep.botId);
                            loop.bind(null, i+1, max, done)();
                        })
                        .catch(dep => {
                            logger.info(`Deposit (${dep.id}) was not assigned a bot.`);
                            debug('Deposit (%s) was not assigned a bot.', dep.id);
                            loop.bind(null, i+1, max, done)();
                        });
                    } else {
                        done();
                    }
                }) (0, deposits.length, () => {
                    db.end();
                    debug('Fetching next records set.');
                    setTimeout(this.assignBot.bind(this), config.fetchInterval);
                });
            })
            .catch(e => {
                logger.error('Error getting deposit records.', e);
                debug('Error getting deposit records. error(%s).', e.message);
                setTimeout(this.assignBot.bind(this), config.fetchInterval);
            });
        })
        .catch(err => {
            logger.error(err);
            debug(err.message);
            setTimeout(this.assignBot.bind(this), config.fetchInterval);
        });
    }

    getAvailableBot(deposit, bots) {
        if (!deposit) {
            throw new Error('A deposit record is needed to assign bot.');
            return false;
        }

        let items = null;
        try {
            items = JSON.parse(deposit.items);
        } catch (e) {
            logger.error('Error parsing deposit items.', e);
            debug('Error parsing deposit items. error(%s).', e.message);
            return false;
        }

        let botsList = Object.keys(bots);
        
        function roundRobinOnce(list, items,  test) {

            if (test >= list.length) {
                return false;
            }

            let ci = (LUBI + 1) % list.length;
            let botId = list[ci];
            LUBI = ci;

            // console.log(ci, botId, (bots[botId].data.inventoryCount + items.length));
            if((bots[botId].inventory + items.length) <= 1000 && bots[botId].type === 1) {
                return botId;
            } else {
                return roundRobinOnce(list, items, ++test);
            }
        }

        let assignedBotId = roundRobinOnce(botsList, items, 0);

        if (assignedBotId === false) {
            return false;
        }

        return assignedBotId;
    } 
}

new Scheduler();
