'use strict';

/*
Auther: Vince
Description: A steam bot withdraw handler.

Notification message events:

*/

import config from './config.js';
import mysql from 'mysql';
import Debug from 'debug';
import request from 'request';
import winston from 'winston';
import EventEmitter from 'events';
import BotEResult from './bot-eresult.js';
import crypto from 'crypto';
import TradeOfferManager from 'steam-tradeoffer-manager';


const
    botDetails = JSON.parse(process.env.bot),
    debug = Debug(`bot:${botDetails.account_name}:${botDetails.id}:withdraw>`),
    WITHDRAW_STATES = {
        "Error": 0,
        "Queued": 1,
        "OfferSent": 2,
        "OfferAccepted": 3,
        "ItemsDeassigned": 4,

        "0": "Error",
        "1": "Queued",
        "2": "Offer Sent",
        "3": "Offer Accepted",
        "4": "Items Deassigned"
    },
    OFFER_TYPES = {
        "Deposit": 1,
        "Withdraw": 2
    },
    ITEM_STATES = {
        "InActive": 0,
        "Active": 1,
        "Locked": 2,
        "InGame": 3,
        "Withdrawn": 4,
        "QueuedForWithdraw": 5,
    
        "0": "Inactive",
        "1": "Active",
        "2": "Locked",
        "3": "In Game",
        "4": "Withdrawn",
        "5": "Queued for withdraw"
    };


export default class Withdraw extends EventEmitter {
    constructor(bot, redis) {
        super();

        this.bot = bot;
        this.redis = redis;

        this.isAcceptProcessRunning = false;
        this.isWithdrawProcessRunning = false;

        this.log = new (winston.Logger)({
            transports: [
                new (winston.transports.File)({
                    filename: '../log/bot_' + this.bot.self.account_name + '_withdraw.log',
                    maxsize: 1048576
                })
            ]
        });
    }

    markAccepted(offer) {
        let db = mysql.createConnection(config.mysql);
        let id = offer.data('withdrawId');

        db.query('UPDATE withdraw SET offer_state = ?, offer_response = ?, state = ? WHERE id = ? AND offer_id = ?',
            [
                offer.state,
                TradeOfferManager.ETradeOfferState[offer.state],
                WITHDRAW_STATES.OfferAccepted,
                id,
                offer.id
            ],
            (err, result) => {
                db.end();
                if (err) {
                    let attempt = offer.data('attempt-mark-accepted');
                    
                    if (!attempt) {
                        attempt = 0;
                    }

                    debug('Error updating the accepted offer %s, [withdraw id: %s, offer state: %s, error: %s, attempt: %s]', offer.id, id, TradeOfferManager.ETradeOfferState[offer.state], err.message, attempt);
                    this.log.error('Error updating the accepted offer.', {err, offer});
                    
                    if (attempt >= config.bot.retryCount) {
                        debug('Offer %s, [withdraw id: %s, offer state: %s, error: %s] all attempts failed.', offer.id, id, TradeOfferManager.ETradeOfferState[offer.state], err.message)
                        this.log.error(`Offer ${offer.id}, [withdraw id: ${id}, offer state: ${TradeOfferManager.ETradeOfferState[offer.state]}] all attempts failed.`);
                        return;
                    }

                    setTimeout(() => {
                        //Let's change the state to active so that next poll can attempt to update this offer.
                        this.bot.offers.pollData['sent'][offer.id] = TradeOfferManager.ETradeOfferState.Active;
                    }, config.bot.retryIntervalList[attempt]);
                    
                    offer.data('attempt-mark-accepted', attempt + 1);
                    return;
                }

                this.sendMessage('withdraw.accepted', offer);

                debug('Offer %s, [withdraw id: %s, offer state: %s] updated.', offer.id, id, TradeOfferManager.ETradeOfferState[offer.state]);
                this.log.info(`Offer ${offer.id}, [withdraw id: ${id}, offer state: ${TradeOfferManager.ETradeOfferState[offer.state]}] updated`);
                return;
            }
        );
    }

    processAcceptedWithdraws() {
        this.isAcceptProcessRunning = true;

        this
        .fetchAcceptedWithdrawRecords()
        .then(withdraws => {
            (function loop(i, max, done) {
                if (i < max && !this.bot.pause && !this.bot.isDisconnected) {
                    new Promise((resolve, reject) => {
                        let withdraw = withdraws[i];

                        this
                        .deassignWithdrawRecord(withdraw)
                        .then(done => { 
                            debug('Withdraw(%s) offer(%s) successful.', withdraw.id, withdraw.offer_id);
                            this.log.info(`Withdraw(${withdraw.id}) offer (${withdraw.offer_id}) successful.`);
                            resolve(done);
                        })
                        .catch(err => {
                            debug('Withdraw(%s) offer (%s) deassignment error(%s).', withdraw.id, withdraw.offer_id, err.message);
                            this.log.info(`Withdraw(${withdraw.id}) offer (${withdraw.offer_id}) deassignment error.`, err);
                            reject(err);
                        });
                    })
                    .then(result => {
                        setTimeout(loop.bind(this), 1000, i+1, max, done);
                    })
                    .catch(err => {
                        debug('Error deassigning items error(%s).', err.message);
                        this.log.info(`Error deassigning items.`, err);
                        setTimeout(loop.bind(this), 1000, i+1, max, done);
                    });
                } else {
                    done();
                }
            }.bind(this))(0, withdraws.length, () => {
                // debug('Pull next 10 accepted withdraw records...');
                this.log.info('Current accepted withdraw record set completed.');
                setTimeout(this.processAcceptedWithdraws.bind(this), config.bot.withdrawFetchInterval);
            });
        })
        .catch(err => {
            // debug('Error occurred error(%s). Pull next 10 accepted withdraw records...', err.message);
            this.log.info(`Error fetchAcceptedWithdrawRecords  `, err);
            setTimeout(this.processAcceptedWithdraws.bind(this), config.bot.withdrawFetchInterval);
        })
        
    }

    deassignWithdrawRecord(withdraw) {
        return new Promise((resolve, reject) => {
            let items = withdraw.items.split(',');

            if (items.length <= 0) {
                reject(new Error('Unable to get withdrawal items to deassign.'));
                return;
            }

            let db = mysql.createConnection(config.mysql);
            db.query('UPDATE inventory SET state = ? WHERE id IN ?',
            [
                ITEM_STATES.Withdrawn,
                [items]
            ],
            (err, result) => {
                if (err) {
                    db.end();
                    reject(err);
                    return;
                }

                db.query('UPDATE withdraw SET state = ? WHERE id = ?',
                [
                    WITHDRAW_STATES.ItemsDeassigned,
                    withdraw.id
                ],
                (err, result) => {
                    db.end();

                    if (err) {
                        reject(err);
                        return;
                    }

                    resolve(result);
                });
            });
        });
    }

    fetchAcceptedWithdrawRecords() {
        return new Promise((resolve, reject) => {
            let SQL = `SELECT w.*, u.profile_name, u.avatar, u.steam_id, u.trade_url, u.role_id, u.is_banned, GROUP_CONCAT(DISTINCT wi.inventory_id SEPARATOR ',') as items FROM withdraw w LEFT JOIN withdraw_item wi ON(wi.withdraw_id = w.id) LEFT JOIN inventory i ON(i.id = wi.inventory_id) LEFT JOIN user u ON (w.user_id = u.id) WHERE w.state = ${WITHDRAW_STATES.OfferAccepted} AND i.bot_id = ${this.bot.self.id} AND i.state = ${ITEM_STATES.QueuedForWithdraw} AND offer_id IS NOT NULL GROUP BY wi.withdraw_id LIMIT 10`;

            let db = mysql.createConnection(config.mysql);

            db.query(SQL, (err, result) => {
                db.end();
                if (err) {
                    debug('Error fetching accepted withdraw records. error(%s).', err.message);
                    this.log.error('Error fetching accepted withdraw records.', err);
                    reject(err);
                    return;
                }

                resolve(result);
            });
        });
    }

    fetchWithdrawRecords() {
        return new Promise((resolve, reject) => {
            let SQL = `SELECT w.*, u.profile_name, u.avatar, u.steam_id, u.trade_url, u.role_id, u.is_banned, GROUP_CONCAT(DISTINCT i.asset_id SEPARATOR ',') as items FROM withdraw w LEFT JOIN withdraw_item wi ON(wi.withdraw_id = w.id) LEFT JOIN inventory i ON(i.id = wi.inventory_id) LEFT JOIN user u ON (w.user_id = u.id) WHERE w.state = ${WITHDRAW_STATES.Queued} AND i.bot_id = ${this.bot.self.id} AND i.state = ${ITEM_STATES.QueuedForWithdraw} AND offer_id IS NULL GROUP BY wi.withdraw_id LIMIT 10`;

            let db = mysql.createConnection(config.mysql);

            db.query(SQL, (err, result) => {
                db.end();
                if (err) {
                    debug('Error fetching withdraw records. error(%s).', err.message);
                    this.log.error('Error fetching withdraw records.', err);
                    reject(err);
                    return;
                }

                resolve(result);
            });
        });
    }

    processWithdraws() {
        this.isWithdrawProcessRunning = true;

        this
        .fetchWithdrawRecords()
        .then(withdraws => {
            (function loop(i, max, done) {
                if (i < max && !this.bot.pause && !this.bot.isDisconnected) {
                    new Promise((resolve, reject) => {
                        let withdraw = withdraws[i];

                        this
                        .validateWithdrawRecord(withdraw)
                        .then(items => {
                            let offer = this.bot.offers.createOffer(withdraw.trade_url);
                            let securityToken = crypto.randomBytes(8).toString('hex');

                            offer.data('offerType', OFFER_TYPES.Withdraw);
                            offer.data('withdrawId', withdraw.id);
                            offer.data('userId', withdraw.user_id);
                            offer.data('secretToken', securityToken);

                            let partnerSteamID = offer.partner.getSteamID64();
                            if (partnerSteamID != withdraw.steam_id) {
                                
                                debug('Steam ID of partner doesn\'t match (OnRecord:%s != Offer:%s).', withdraw.steam_id, partnerSteamID);
                                this.log.error(`Steam ID of partner doesn't match (OnRecord:${withdraw.steam_id} != Offer:${partnerSteamID}).`);
                                
                                this.sendMessage('withdraw.error', null, null, {
                                    "error": `Steam ID of partner doesn't match (OnRecord:${withdraw.steam_id} != Offer:${partnerSteamID}).`,
                                    "errno": BotEResult.SteamIDMismatch
                                });
                                
                                this.markErrorRecord(BotEResult.SteamIDMismatch, withdraw.id);

                                this.activateWithdrawItems(offer);

                                reject(new Error(BotEResult[BotEResult.SteamIDMismatch]));
                                return;
                            }

                            offer.setMessage(`Withdraw# ${withdraw.id}, Token# ${securityToken} on site ${config.site}`);
                            
                            for(let i=0; i<items.length; i++) {
                                offer.addMyItem({
                                    "appid": 730,
                                    "contextid": 2,
                                    "amount": 1,
                                    "assetid": items[i]
                                });
                            }
    
                            offer.send((err, status) => {
                                if (err) {
                                    let errSplit = /\((\d+)\)/g.exec(err.message);
                                    let errno = undefined;

                                    if(Array.isArray(errSplit)) {
                                        errno = errSplit[1];
                                    }

                                    debug('Unable to send trade offer. error(%s - %s).', errno, err.message);
                                    this.log.error(`Unable to send trade offer withdraw(${withdraw.id}).`, err);
                                    
                                    this.sendMessage('withdraw.error', offer, null, {
                                        "error": err,
                                        "errno": errno
                                    });
                                    
                                    this.markErrorRecord(BotEResult.UnknownTradeError, withdraw.id, errno);

                                    this.activateWithdrawItems(offer);

                                    reject(err);
                                    return;
                                }

                                this.confirmOffer(offer, 0);
    
                                this
                                .updateWithdraw(withdraw, offer, WITHDRAW_STATES.OfferSent)
                                .then(offerId => {
                                    // console.log('offer updated');
                                    resolve(offerId);
                                })
                                .catch(err => {
                                    debug('Cannot update withdraw (%s) to offer(%s) sent state. error(%s)', withdraw.id, offer.id, err.message);
                                    this.log.error(`Cannot update withdraw (${withdraw.id}) to offer(${offer.id}) sent state`, err);
                                    this.markErrorRecord(BotEResult.TradeSuccessDBError, withdraw.id);
                                    reject(err);
                                });
                            });
                        })
                        .catch(err => {
                            debug('Cannot validate withdraw (%s) to offer(%s) sent state. error(%s)', withdraw.id, err.message);
                            this.log.error(`Cannot validate withdraw (${withdraw.id})`, err);
                            reject(err);
                        });
                    })
                    .then(result => {
                        setTimeout(loop.bind(this), 1000, i+1, max, done);
                    })
                    .catch(err => {
                        debug('Error in loop body. error(%s).', err.message);
                        this.log.error('Error in loop body.', err);
                        setTimeout(loop.bind(this), 1000, i+1, max, done);
                    });
                } else {
                    done();
                }
            }.bind(this))(0, withdraws.length, () => {
                // debug('Pull next 10 withdraw records...');
                this.log.info('Current withdraw record set completed.');
                setTimeout(this.processWithdraws.bind(this), config.bot.withdrawFetchInterval);
            });
        })
        .catch(err => {
            // debug('Error processing withdraws. error(%s).', err.message);
            this.log.error('Error fetchWithdrawRecords.', err);
            setTimeout(this.processWithdraws.bind(this), config.bot.withdrawFetchInterval);
        });
    }

    confirmOffer(offer, attempt) {
        if (!offer.id) {
            debug('Cannot accept confirmation without offer ID.');
            this.log.error('Cannot accept confirmation without offer ID.');
            return
        }

        let 
            wid = offer.data('withdrawId'),
            uid = offer.data('userId');

        if (attempt >= config.bot.retryCount) {
            // No need to write this case as it will be automatically canceled after cancelInterval of offer manager
            // offer.cancel(()=>{
            //     // Offer items revert case will be handled in cancel offer case.
            //     debug('Offer(%s) canceled due to confirmation fault.', offer.id);
            //     this.log.error(`Offer(${offer.id}) canceled due to confirmation fault.`, offer);
            //     this.sendMessage('withdraw.canceled', offer);
            // });
            debug('Cannot confirm offer(%s) all attempts failed', offer.id);
            this.log.error(`Cannot confirm offer(${offer.id}) all attempts failed`, offer);
            return;
        }

        this.bot.community.acceptConfirmationForObject(this.bot.self.identity_secret, offer.id, err => {
            if (err) {
                debug('Offer(%s) confirmation failed. Next attempt after %ss.', offer.id, config.bot.retryIntervalList[attempt]);
                this.log.error(`Offer(${offer.id}) confirmation failed. Next attempt after ${config.bot.retryIntervalList[attempt]}s.`);
                setTimeout(this.confirmOffer.bind(this), config.bot.retryIntervalList[attempt] * 1000, offer, ++attempt);
                return;
            }

            this.sendMessage('withdraw.sent', offer);
            debug('Offer sent to user(%s) offer id (%s) withdraw id (%s).', uid, offer.id, wid);
            this.log.info(`Offer sent to user (${uid}) offer id (${offer.id}) withdraw id (${wid}).`);
        });
    }

    validateWithdrawRecord(withdraw) {
        return new Promise((resolve, reject) => {
            let items = withdraw.items.split(',');
                        
            if (!items || items.length <= 0) {
                debug('No items to withdraw(%s) found.', withdraw.id);
                this.log.error('No items to withdraw found.', withdraw);

                this.sendMessage('withdraw.error', null, null, {
                    "error": new Error("No items found."),
                });

                this.markErrorRecord(BotEResult.NoWithdrawItems, withdraw.id);

                reject(new Error('No items to withdraw found.'));
                return;
            }

            if (!withdraw.trade_url) {
                debug('Error user(%s) trade url not found for withdraw(%s).', withdraw.user_id, withdraw.id);
                this.log.error(`Error user (${withdraw.user_id}) trade url not found for withdraw.`, withdraw);

                this.sendMessage('withdraw.error', null, null, {
                    "error": new Error("No trade URL."),
                });

                // Let user resend the withdraw request after correcting the trade url
                this.markErrorRecord(BotEResult.NoTradeUrl, withdraw.id);

                reject(new Error('Error user trade url not found for withdraw.'));
                return;
            }

            let pattTradeUrl = /^https\:\/\/steamcommunity\.com\/tradeoffer\/new\/\?partner=(\d+)&token=([\w\d\-]+)$/im;

            if (!pattTradeUrl.test(withdraw.trade_url)) {
                debug('Error user(%s) trade url is invalid for withdraw(%s).', withdraw.user_id, withdraw.id);
                this.log.error('Error user trade url is invalid for withdraw.', withdraw);
                
                this.sendMessage('withdraw.error', null, null, {
                    "error": new Error("Invalid trade URL."),
                });

                this.markErrorRecord(BotEResult.InvalidTradeUrl, withdraw.id);

                reject(new Error('Error user trade url is invalid for withdraw.'));
                return;
            }

            resolve(items);
        });
    }

    updateWithdraw(withdraw, offer, state) {
        return new Promise((resolve, reject) => {
            let db = mysql.createConnection(config.mysql);
            db.query('UPDATE withdraw SET offer_id = ?, offer_state = ?, offer_response = ?, state = ? WHERE id = ?', 
                [
                    offer.id,
                    TradeOfferManager.ETradeOfferState.Active,
                    TradeOfferManager.ETradeOfferState[TradeOfferManager.ETradeOfferState.Active],
                    state,
                    withdraw.id
                ], 
                (err, result) => {
                    if (err) {
                        offer.cancel((err) => {
                            if (err) {
                                debug('Unable to cancel the failed withdraw(%s) offer(%) for user(%s).', offer.id, withdraw.user_id, withdraw.id);
                                this.log.error(`Unable to cancel the failed withdraw(${withdraw.id}) offer(${offer.id}) for user(${withdraw.user_id}).`, withdraw);
                            }
                            
                            this.sendMessage('withdraw.sent.canceled', offer, null, {
                                "error": new Error('db.error'),
                            });
                        });
    
                        debug('Unable to update withdraw(%s) record for offer(%s) to state(%s).', withdraw.id, offer.id, WITHDRAW_STATES[state]);
                        this.log.error(`Unable to update withdraw(${withdraw.id}) record for offer(${offer.id}) to state(${WITHDRAW_STATES[state]})`, withdraw);
                        db.end();
                        reject(err);
                        return;
                    }
    
                    db.end();
                    resolve(offer.id);
            });
        });
        
    }

    handleCanceledOffer(offer) {
        let SQL = "UPDATE withdraw SET offer_state = ?, offer_response = ?, state = ? WHERE id = ?";
        let id = offer.data('withdrawId');
        
        let db = mysql.createConnection(config.mysql);
        db.query(SQL, 
        [
            offer.state, 
            TradeOfferManager.ETradeOfferState[offer.state],
            BotEResult.TradeOfferCanceled,
            id
        ], 
        (err, eresult) => {
            db.end();

            if (err) {
                debug('Cannot mark withdraw(%s) offer %s.', id, TradeOfferManager.ETradeOfferState[offer.state]);
                this.log.error(`Cannot mark withdraw(${id}) offer ${TradeOfferManager.ETradeOfferState[offer.state]}.`, err);
                return;
            }

            this.sendMessage('withdraw.canceled', offer);

            setTimeout(this.activateWithdrawItems.bind(this), 0, offer);

            debug('Withdraw(%s) offer marked %s.', id, TradeOfferManager.ETradeOfferState[offer.state]);
            this.log.error(`Withdraw(${id}) offer marked ${TradeOfferManager.ETradeOfferState[offer.state]}.`);
        });
    }

    activateWithdrawItems(offer) {
        let SQL = "SELECT inventory_id FROM withdraw_item WHERE withdraw_id = ?";
        let db = mysql.createConnection(config.mysql);
        let wid = offer.data('withdrawId');

        db.query(SQL, [wid], (err, items) => {
            if (err) {
                db.end();
                debug('Error getting the withdraw items. error(%s).', err.message);
                this.log.error(`Error getting the withdraw (${wid}) items.`, err);
                reject(err);
                return;
            }

            let itemIds = [];

            for(let i=0; i<items.length; i++) {
                itemIds.push(items[i].inventory_id);
            }

            db.query("UPDATE inventory SET state = ? WHERE id IN ?",
            [
                ITEM_STATES.Active,
                [itemIds]
            ],
            (err, result) => {
                db.end();
                if (err) {
                    let attempt = offer.data('attempt-set-item-active');
                    
                    if (!attempt) {
                        attempt = 0;
                    } 

                    debug('Error setting items active offer %s, [withdraw id: %s, offer state: %s, error: %s, attempt: %s]', offer.id, wid, TradeOfferManager.ETradeOfferState[offer.state], err.message, attempt);
                    this.log.error(`Error setting items active offer withdraw(${offer.data('withdrawId')}).`, {err, offer, itemIds});
                    
                    if (attempt >= config.bot.retryCount) {
                        debug('Offer %s, [withdraw id: %s, offer state: %s, error: %s] all attempts failed.', offer.id, wid, TradeOfferManager.ETradeOfferState[offer.state], err.message)
                        return;
                    }

                    if (offer.id) {
                        setTimeout(() => {
                            //Let's change the state to active so that next poll can attempt to update this offer.
                            this.bot.offers.pollData['sent'][offer.id] = TradeOfferManager.ETradeOfferState.Active;
                        }, config.bot.retryIntervalList[attempt]);
                        offer.data('attempt-set-item-active', attempt + 1);
                    }
                    return;
                }
            });
        });
    }

    markErrorRecord(ecode, id, errno) {
        let SQL = "UPDATE withdraw SET ";
        let params = null;

        if (errno) {
            SQL += " state = ?, offer_state = ?, offer_response = ? WHERE id = ? "
            params = [ecode, errno, TradeOfferManager.EResult[errno], id];
        } else {
            SQL += " state = ? WHERE id = ?";
            params = [ecode, id];
        }

        let db = mysql.createConnection(config.mysql);
        db.query(SQL, params, (err, eresult) => {
            db.end();

            if (err) {
                debug('Cannot mark deposit(%s) error.', id);
                this.log.error(`Cannot mark deposit(${id}) error.`, err);
                return;
            }

            debug('Deposit(%s) marked error.', id);
            this.log.error(`Deposit(${id}) marked error.`);
        });
    }

    sendMessage(event, offer, to, error) {
        if (!event) {
            throw new Error('Event is required to send the notification.');
            return;
        }

        let msg = {
            "event": event,
            "data": {
                "botId": this.bot.self.id
            }
        };

        if (offer) {
            msg['data']['offerId'] = offer.id || null;
            msg['data']['offerType'] = offer.data('offerType') || null;
            msg['data']['depositId'] = offer.data('depositId') || null;
            msg['data']['withdrawId'] = offer.data('withdrawId') || null;
            msg['data']['userId'] = offer.data('userId') || null;
            msg['data']['secretToken'] = offer.data('secretToken') || null;
        }

        if (!to) {
            msg["to"] = "notifier";
        } else {
            msg["to"] = to;
        }
        
        if (error) {
            msg["data"].error = error.error.message || null;
            msg["data"].errno = error.errno || null;
        }

        this.emit('message', msg);
    }
}







