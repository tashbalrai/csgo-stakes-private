'use strict';

/*
Auther: Vince
Description: A steam bot deposit handler.

Notification message events:
deposit.error => Deposit error event
deposit.sent => Deposit offer was sent.
deposit.sent.canceled => For some reason sent offer was canceled due to some error in the process.
poll.failed => automatic polling failed. It could be sign of steam misbehaving right now.
deposit.accepted => your deposit has been accepted.
deposit.items.assigned => your items have been assigned.
deposit.canceled => your deposit was canceled.
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
import moment from 'moment';


const
    botDetails = JSON.parse(process.env.bot),
    debug = Debug(`bot:${botDetails.account_name}:${botDetails.id}:deposit>`),
    DEPOSIT_STATES = {
        "Error": 0,
        "Queued": 1,
        "OfferSent": 2,
        "OfferAccepted": 3,
        "ItemsAssigned": 4,

        "0": "Error",
        "1": "Queued",
        "2": "Offer Sent",
        "3": "Offer Accepted",
        "4": "Items Assigned"
    },
    OFFER_TYPES = {
        "Deposit": 1,
        "Withdraw": 2
    };;


export default class Deposit extends EventEmitter {
    constructor(bot, redis) {
        super();

        this.bot = bot;
        this.redis = redis;
        this.isAcceptProcessRunning = false;
        this.isDepositProcessRunning = false;

        this.log = new (winston.Logger)({
            transports: [
                new (winston.transports.File)({
                    filename: '../log/bot_' + this.bot.self.account_name + '_deposit.log',
                    maxsize: 1048576
                })
            ]
        });

    }

    acceptDeposit(offer) {
        let db = mysql.createConnection(config.mysql);
        let id = offer.data('depositId');

        db.query('UPDATE deposit SET offer_state = ?, offer_response = ?, state = ?, updated_at = ? WHERE id = ? AND offer_id = ?',
            [
                offer.state,
                TradeOfferManager.ETradeOfferState[offer.state],
                DEPOSIT_STATES.OfferAccepted,
                moment().format('YYYY-MM-DD HH:mm:ss'),
                id,
                offer.id
            ],
            (err, result) => {
                db.end();
                if (err) {
                    let attempt = offer.data('attempt');
                    
                    if (!attempt) {
                        attempt = 0;
                    }

                    debug('Error updating the accepted offer %s, [deposit id: %s, offer state: %s, error: %s, attempt: %s]', offer.id, id, TradeOfferManager.ETradeOfferState[offer.state], err.message, attempt);
                    this.log.error('Error updating the accepted offer.', {err, offer});
                    
                    if (attempt >= config.bot.retryCount) {
                        debug('Offer %s, [deposit id: %s, offer state: %s, error: %s] all attempts failed.', offer.id, id, TradeOfferManager.ETradeOfferState[offer.state], err.message)
                        this.log.error(`Offer ${offer.id}, [deposit id: ${id}, offer state: ${TradeOfferManager.ETradeOfferState[offer.state]}] all attempts failed.`);
                        return;
                    }

                    //Let's change the state to active so that next poll can attempt to update this offer.
                    setTimeout(() => {
                        this.bot.offers.pollData['sent'][offer.id] = TradeOfferManager.ETradeOfferState.Active;
                    }, config.retryIntervalList[attempt]);

                    offer.data('attempt', attempt + 1);                    
                    return;
                }

                this.sendMessage('deposit.accepted', offer);

                debug('Offer %s, [deposit id: %s, offer state: %s] updated.', offer.id, id, TradeOfferManager.ETradeOfferState[offer.state]);
                this.log.info(`Offer ${offer.id}, [deposit id: ${id}, offer state: ${TradeOfferManager.ETradeOfferState[offer.state]}] updated`);

                this.getNewItems(offer, 0);
                return;
            }
        );
    }

    getNewItems(offer, attempt) {
        this.log.info(`Inside get new items offer(${offer.id}) deposit(${offer.data('depositId')})`);
        offer.getReceivedItems((err, items) => {
            this.log.info(`getReceivedItems callback offer(${offer.id}) deposit(${offer.data('depositId')})`, err);
            if (err) {
                debug('Error getting new received items for offer(%s) [deposit id: %s, user id: %s, attempt: %s].', offer.id, offer.data('depositId'), offer.data('userId'), attempt);
                this.log.error(`Error getting new received items for offer(${offer.id}) [deposit id: ${offer.data('depositId')}, user id: ${offer.data('userId')}, attempt: ${attempt}].`, err);

                if (attempt >= config.bot.retryCount) {
                    done(new Error('All attempts to get new items failed.'), null);
                    this.markErrorRecord(BotEResult.RetryFailed, offer.data('depositId'));
                    return;
                }

                setTimeout(this.getNewItems.bind(this), config.bot.retryIntervalList[attempt] * 1000, offer, ++attempt);
                return;
            }

            debug('New items received for offer(%s) deposit(%s).', offer.id, offer.data('depositId'));
            this.log.info(`New items received for offer(${offer.id}) deposit(${offer.data('depositId')}).`, items);
            
            if (!items[0] && !items[0].id) {
                debug('Steam is bad received invalid items (%O) offer(%s) deposit(%s)', items, offer.id, offer.data('depositId'));
                this.log.error(`Steam is bad received invalid items offer(${offer.id}) deposit(${offer.data('depositId')})`, items);
                setTimeout(this.getNewItems.bind(this), config.bot.retryIntervalList[attempt] * 1000, offer, ++attempt);
                return;
            } 

            if (!Array.isArray(items)) {
                items = [items];
            }
            
            offer.receivedItems = items;

            for(let i=0; i<offer.receivedItems.length; i++) {
                offer.receivedItems[i].rarity_color = offer.receivedItems[i].getTag('Rarity').color;
                offer.receivedItems[i].rarity_tag_name = offer.receivedItems[i].getTag('Rarity').name;
                
                //Following are unwanted items
                delete offer.receivedItems[i].descriptions;
                delete offer.receivedItems[i].owner_descriptions;
                delete offer.receivedItems[i].tags;
            }
            
            this
            .updateNewItemsDeposit(offer)
            .then(result => {
                debug('New items received and updated deposit(%s) offer(%s).', offer.data('depositId'), offer.id);
                this.log.info(`New items received and updated. deposit(${offer.data('depositId')}) offer(${offer.id}).`, err);
            })
            .catch(err => {
                debug('Error %s', err.message);
                this.log.error(`Error updateAcceptedDeposit deposit(${offer.data('depositId')}) offer(${offer.id}).`, err);
                setTimeout(this.getNewItems.bind(this), config.bot.retryIntervalList[attempt] * 1000, offer, ++attempt);
            });
        });
    }

    processAcceptedItems() {
        this.isAcceptProcessRunning = true;

        this
        .fetchAcceptedDepositRecords()
        .then(deposits => {
            (function loop(i, max, done) {
                if (i < max && !this.bot.pause && !this.bot.isDisconnected) {
                    new Promise((resolve, reject) => {
                        let deposit = deposits[i];
                        this.bot.offers.getOffer(deposit.offer_id, (err, offer) => {
                            if (err) {
                                debug('Error on get offer offer(%s) deposit(%s) error(%s).', deposit.offer_id, deposit.id, err.message);
                                this.log.error(`Error on get offer (${deposit.offer_id}) deposit(${deposit.id}) error(${err.message})`, err);
                                reject(err);
                                return;
                            }

                            offer.receivedItems = JSON.parse(deposit.received_items);

                            this
                            .updateAcceptedDeposit(offer)
                            .then(done => {
                                this
                                .assignItemsToUser(offer)
                                .then(done => {
                                    debug('Items assigned for deposit %s, offer %s, user %s, token %s.', deposit.id, offer.id, deposit.user_id, offer.data('secretToken'));
                                    this.log.info(`Items assigned for deposit ${deposit.id}, offer ${offer.id}, user ${deposit.user_id}, token ${offer.data('secretToken')}.`);
        
                                    this.sendMessage('deposit.items.assigned', offer);
        
                                    resolve(offer);
                                    return;
                                })
                                .catch(err => {
                                    debug('Error %s', err.message);
                                    this.log.error(`Error assignItemsToUser deposit(${deposit.id}) offer(${offer.id}).`, err);
                                    reject(err);
                                });
                            })
                            .catch(err => {
                                debug('Error %s', err.message);
                                this.log.error(`Error updateAcceptedDeposit deposit(${deposit.id}) offer(${offer.id}).`, err);
                                reject(err);
                            });
                        });
                    })
                    .then(result => {
                        setTimeout(loop.bind(this), 1000, i+1, max, done);
                    })
                    .catch(err => {
                        debug('Error %s', err.message);
                        this.log.error(`Error accepting deposit(${deposit.id}) offer(${offer.id}).`, err);
                        setTimeout(loop.bind(this), 1000, i+1, max, done);
                    });
                } else {
                    done();
                }
            }.bind(this))(0, deposits.length, () => {
                // debug('Pull next 10 accepted deposit records...');
                // this.log.info('Current accepted deposit record set completed.');
                setTimeout(this.processAcceptedItems.bind(this), config.bot.depositFetchInterval);
            });
        })
        .catch(err => {
            // debug('Error occurred error(%s). Pull next 10 accepted deposit records...', err.message);
            this.log.info(`Error fetching accepted deposits`, err);
            setTimeout(this.processAcceptedItems.bind(this), config.bot.depositFetchInterval);
        })
        
    }

    updateAcceptedDeposit(offer) {
        return new Promise((resolve, reject) => {
            let SQL = 'UPDATE deposit SET state = ? WHERE id = ? AND offer_id = ?';
            const db = mysql.createConnection(config.mysql);

            db.query(SQL, [
                DEPOSIT_STATES.ItemsAssigned,
                offer.data('depositId'),
                offer.id
            ], (err, result) => {
                db.end();
                
                if (err) {
                    debug('Error setting items assigned state for offer(%s) [deposit id: %s, user id: %s] error(%s)', offer.id, offer.data('depositId'), offer.data('userId'), err.message);
                    this.log.error(`Error setting items assigned state deposit(${deposit.id}) offer(${offer.id}).`, err);
                    reject(err);
                    return;
                }

                resolve(result);
            });
        });
    }

    updateNewItemsDeposit(offer) {
        return new Promise((resolve, reject) => {
            let SQL = 'UPDATE deposit SET received_items = ? WHERE id = ? AND offer_id = ?';
            const db = mysql.createConnection(config.mysql);

            db.query(SQL, [
                JSON.stringify(offer.receivedItems),
                offer.data('depositId'),
                offer.id
            ], (err, result) => {
                db.end();
                
                if (err) {
                    debug('Error setting items assigned state for offer(%s) [deposit id: %s, user id: %s] error(%s)', offer.id, offer.data('depositId'), offer.data('userId'), err.message);
                    this.log.error(`Error setting items assigned state deposit(${offer.data('depositId')}) offer(${offer.id}).`, err);
                    reject(err);
                    return;
                }

                resolve(result);
            });
        });
    }

    assignItemsToUser(offer) {
        return new Promise((resolve, reject) => {
            let recItems = [];
            const 
                uid = offer.data('userId'),
                did = offer.data('depositId'),
                secretToken = offer.data('secretToken');

            this.log.info(`AssignItems Deposit:${did}, offer: ${offer.id}, items: ${JSON.stringify(offer.receivedItems)}`);
            for (let i=0; i<offer.receivedItems.length; i++) {
                recItems[i] = [
                    uid,
                    this.bot.self.id,
                    offer.receivedItems[i].market_hash_name,
                    offer.receivedItems[i].assetid,
                    offer.receivedItems[i].classid,
                    offer.receivedItems[i].icon_url,
                    offer.receivedItems[i].rarity_color,
                    offer.receivedItems[i].rarity_tag_name,
                    `${this.bot.self.id}-${uid}-${did}-${offer.receivedItems[i].assetid}`,
                    1,
                    JSON.stringify({"depositId": did, secretToken})
                ];

            }

            const SQL = 'REPLACE INTO inventory (user_id, bot_id, mhash, asset_id, class_id, image, rarity_color, rarity_tag_name, asset_uuid, state, notes) VALUES ?';
            const db = mysql.createConnection(config.mysql);

            db.query(SQL, [recItems], (err, result) => {
                db.end();

                if (err) {
                    debug('Error inserting new items for offer(%s) [deposit id:%s, user id:%s] error(%s).', offer.id, did, uid);
                    this.log.error(`Error inserting new items for offer ${offer.id} [deposit id:${did}, user id:${uid}]`, err);
                    reject(err);
                    return;
                }

                resolve(result);
            });
        });
    }

    fetchAcceptedDepositRecords() {
        return new Promise((resolve, reject) => {
            let SQL = `SELECT * FROM deposit WHERE state = ${DEPOSIT_STATES.OfferAccepted} AND bot_id = ${this.bot.self.id}`;
            SQL += ' AND offer_id IS NOT NULL AND received_items IS NOT NULL LIMIT 10';

            let db = mysql.createConnection(config.mysql);

            db.query(SQL, (err, result) => {
                db.end();
                if (err) {
                    debug('Error fetching accepted deposit records. error(%s).', err.message);
                    this.log.error('Error fetching accepted deposit records.', err);
                    reject(err);
                    return;
                }

                resolve(result);
            });
        });
    }

    fetchDepositRecords() {
        return new Promise((resolve, reject) => {
            let SQL = `SELECT d.*, u.profile_name, u.avatar, u.steam_id, u.trade_url, u.role_id, u.is_banned  FROM deposit d LEFT JOIN user u ON (d.user_id = u.id) WHERE d.state = ${DEPOSIT_STATES.Queued} AND d.bot_id = ${this.bot.self.id}`;
            SQL += ' AND offer_id IS NULL LIMIT 10';

            let db = mysql.createConnection(config.mysql);

            db.query(SQL, (err, result) => {
                db.end();
                if (err) {
                    debug('Error fetching deposit records. error(%s).', err.message);
                    this.log.error('Error fetching deposit records.', err);
                    reject(err);
                    return;
                }

                resolve(result);
            });
        });
    }

    processDeposits() {
        this.isDepositProcessRunning = true;

        this
        .fetchDepositRecords()
        .then(deposits => {
            (function loop(i, max, done) {
                if (i < max && !this.bot.pause && !this.bot.isDisconnected) {
                    new Promise((resolve, reject) => {
                        let deposit = deposits[i];

                        this
                        .validateDepositRecord(deposit)
                        .then(items => {
                            let offer = this.bot.offers.createOffer(deposit.trade_url);
                            let securityToken = crypto.randomBytes(8).toString('hex');
                            
                            let partnerSteamID = offer.partner.getSteamID64();
                            if (partnerSteamID != deposit.steam_id) {
                                
                                debug('Steam ID of partner doesn\'t match (OnRecord:%s != Offer:%s).', deposit.steam_id, partnerSteamID);
                                this.log.error(`Steam ID of partner doesn't match (OnRecord:${deposit.steam_id} != Offer:${partnerSteamID}).`);
                                
                                this.sendMessage('deposit.error', null, null, {
                                    "error": `Steam ID of partner doesn't match (OnRecord:${deposit.steam_id} != Offer:${partnerSteamID}).`,
                                    "errno": BotEResult.SteamIDMismatch
                                });
                                
                                this.markErrorRecord(BotEResult.SteamIDMismatch, deposit.id);

                                reject(new Error(BotEResult[BotEResult.SteamIDMismatch]));
                                return;
                            }

                            offer.data('offerType', OFFER_TYPES.Deposit);
                            offer.data('depositId', deposit.id);
                            offer.data('userId', deposit.user_id);
                            offer.data('secretToken', securityToken);

                            this
                            .validateUserEscrowDays(offer)
                            .then(passed => {
                                offer.setMessage(`Deposit# ${deposit.id}, Token# ${securityToken} on site ${config.site}`);
                                
                                for(let i=0; i<items.length; i++) {
                                    offer.addTheirItem({
                                        "appid": 730,
                                        "contextid": 2,
                                        "amount": 1,
                                        "assetid": items[i].assetid
                                    });
                                }
        
                                offer.send((err, status) => {
                                    if (err) {
                                        let errSplit = /\((\d+)\)/g.exec(err.message);
                                        let errno = undefined;
                                        
                                        if(Array.isArray(errSplit)) {
                                            errno = errSplit[1];
                                        }

                                        debug('Unable to send trade offer. deposit(%s) error(%s - %s).', deposit.id, errno, err.message);
                                        this.log.error(`Unable to send trade deposit (${deposit.id}).`, err);
                                        
                                        this.sendMessage('deposit.error', offer, null, {
                                            "error": err,
                                            "errno": errno
                                        });
                                        
                                        this.markErrorRecord(BotEResult.UnknownTradeError, deposit.id, errno);

                                        reject(err);
                                        return;
                                    }
                                    
                                    this.sendMessage('deposit.sent', offer);
        
                                    debug('Offer sent to user(%s) offer id (%s) deposit id (%s).', deposit.user_id, offer.id, deposit.id);
                                    this.log.info(`Offer sent to user (${deposit.user_id}) offer id (${offer.id}) deposit id (${deposit.id}).`);
        
                                    this
                                    .updateDeposit(deposit, offer, DEPOSIT_STATES.OfferSent)
                                    .then(offerId => {
                                        this.log.info(`Deposit sent successfully. deposit id# ${deposit.id}, i# ${i}, max# ${max}`);
                                        debug(`Deposit sent successfully. deposit id# ${deposit.id}, i# ${i}, max# ${max}`);
                                        resolve(offerId);
                                    })
                                    .catch(err => {
                                        debug('Cannot update deposit(%s) state. error(%s).', deposit.id, err.message);
                                        this.log.info(`Cannot update deposit(${deposit.id}) state.`, err);
                                        this.markErrorRecord(BotEResult.TradeSuccessDBError, deposit.id);
                                        reject(err);
                                    });
                                });
                            })
                            .catch(err => {
                                debug('Cannot validate user escrow for deposit(%s). error(%s).', deposit.id, err.message);
                                this.log.info(`Cannot validate user escrow for deposit(${deposit.id}).`, err);
                                reject(err);
                            })
                        })
                        .catch(err => {
                            debug('Cannot validate deposit(%s) record. error(%s).', deposit.id, err.message);
                            this.log.info(`Cannot validate deposit(${deposit.id}) record.`, err);
                            reject(err);
                        });
                    })
                    .then(result => {
                        this.log.info(`Fetching next record. i# ${i}, max# ${max}`);
                        debug(`Fetching next record. i# ${i}, max# ${max}`);
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
            }.bind(this))(0, deposits.length, () => {
                // debug('Pull next 10 deposit records...');
                // this.log.info(`Current record set completed. Fetching next in ${config.bot.depositFetchInterval}`);
                setTimeout(this.processDeposits.bind(this), config.bot.depositFetchInterval);
            });
        })
        .catch(err => {
            // debug('Error processing deposits. error(%s).', err.message);
            this.log.error('Error fetching deposits.', err);
            setTimeout(this.processDeposits.bind(this), config.bot.depositFetchInterval);
        });
    }

    validateDepositRecord(deposit) {
        return new Promise((resolve, reject) => {
            let items = null;
            try {
                items = JSON.parse(deposit.items);
            } catch (e) {
                debug('Error parsing deposit(%s) items. error(%s).', deposit.id, e.message);
                this.log.error('Error parsing deposit items.', e, deposit);

                this.sendMessage('deposit.error', null, null, {
                    "error": new Error("Invalid items json."),
                });

                this.markErrorRecord(BotEResult.JSONParseErrorDepItem, deposit.id); 

                reject(e);
                return;
            }

            if (!items || items.length <= 0) {
                debug('No items to deposit(%s) found.', deposit.id);
                this.log.error('No items to deposit found.', deposit);

                this.sendMessage('deposit.error', null, null, {
                    "error": new Error("No items found."),
                });

                this.markErrorRecord(BotEResult.NoDepItems, deposit.id);

                reject(new Error('No items to deposit found.'));
                return;
            }

            if (!deposit.trade_url) {
                debug('Error user(%s) trade url not found for deposit(%s).', deposit.user_id, deposit.id);
                this.log.error('Error user trade url not found for deposit.', deposit);

                this.sendMessage('deposit.error', null, null, {
                    "error": new Error("No trade URL."),
                });

                // Let user resend the deposit request after correcting the trade url
                this.markErrorRecord(BotEResult.NoTradeUrl, deposit.id);

                reject(new Error('Error user trade url not found for deposit.'));
                return;
            }

            let pattTradeUrl = /^https\:\/\/steamcommunity\.com\/tradeoffer\/new\/\?partner=(\d+)&token=([\w\d\-]+)$/im;

            if (!pattTradeUrl.test(deposit.trade_url)) {
                debug('Error user(%s) trade url is invalid for deposit(%s).', deposit.user_id, deposit.id);
                this.log.error('Error user trade url is invalid for deposit.', deposit);
                
                this.sendMessage('deposit.error', null, null, {
                    "error": new Error("Invalid trade URL."),
                });

                this.markErrorRecord(BotEResult.InvalidTradeUrl, deposit.id);

                reject(new Error('Error user trade url is invalid for deposit.'));
                return;
            }

            resolve(items);
        });
    }

    validateUserEscrowDays(offer) {
        return new Promise((resolve, reject) => {
            offer.getUserDetails((err, me, them) => {
                if (err) {
                    debug('Unable to get the user escrowDays. error(%s).', err.message);
                    this.log.error(`Unable to get the user escrowDays OfferID: ${offer.id}, DepositID: ${offer.data('depositId')}.`, err);

                    this.sendMessage('deposit.error', offer, null, {
                        "error": err,
                    });

                    this.markErrorRecord(BotEResult.NoEscrowDays, offer.data('depositId'));

                    reject(err);
                    return;
                }

                if (them.escrowDays > 0) {
                    debug('If completed, trade will be held for %s days OfferID: %s, DepositID: %s. Rejecting...', them.escrowDays, offer.id, offer.data('depositId'));
                    this.log.error(`If completed, trade will be held for ${them.escrowDays} days. OfferID: ${offer.id}, DepositID: ${offer.data('depositId')} Rejecting...`);

                    this.sendMessage('deposit.error', offer, null, {
                        "error": new Error('Offer will be held due to escrow days.'),
                    });

                    this.markErrorRecord(BotEResult.EscrowDaysHeld, offer.data('depositId'));

                    reject(new Error('Offer will be held due to escrow days.'));
                    return;
                }

                resolve(true);
            });
        });
    }

    updateDeposit(deposit, offer, state) {
        return new Promise((resolve, reject) => {
            let db = mysql.createConnection(config.mysql);
            db.query('UPDATE deposit SET offer_id = ?, offer_state = ?, offer_response = ?, state = ? WHERE id = ?', 
                [
                    offer.id,
                    TradeOfferManager.ETradeOfferState.Active,
                    TradeOfferManager.ETradeOfferState[TradeOfferManager.ETradeOfferState.Active],
                    state,
                    deposit.id
                ], 
                (err, result) => {
                    if (err) {
                        offer.cancel((err) => {
                            if (err) {
                                debug('Unable to cancel the failed update offer(%) for user(%s) of deposit(%s).', offer.id, deposit.user_id, deposit.id);
                                this.log.error(`Unable to cancel the failed update offer(${offer.id}) for user(${deposit.user_id}) of deposit(${deposit.id}).`, deposit);
                            }
                            
                            this.sendMessage('deposit.sent.canceled', offer, null, {
                                "error": new Error('db.error'),
                            });
                        });
    
                        debug('Unable to update deposit(%s) record for offer(%s) to state(%s).', deposit.id, offer.id, DEPOSIT_STATES[state]);
                        this.log.error(`Unable to update deposit(${deposit.id}) record for offer(${offer.id}) to state(${DEPOSIT_STATES[state]})`, deposit);
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
        let SQL = "UPDATE deposit SET offer_state = ?, offer_response = ?, state = ? WHERE id = ?";
        let id = offer.data('depositId');
        
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
                debug('Cannot mark deposit(%s) offer %s.', id, TradeOfferManager.ETradeOfferState[offer.state]);
                this.log.error(`Cannot mark deposit(${id}) offer ${TradeOfferManager.ETradeOfferState[offer.state]}.`, err);
                return;
            }

            this.sendMessage('deposit.canceled', offer);

            debug('Deposit(%s) offer marked %s.', id, TradeOfferManager.ETradeOfferState[offer.state]);
            this.log.error(`Deposit(${id}) offer marked ${TradeOfferManager.ETradeOfferState[offer.state]}.`);
        });
    }

    markErrorRecord(ecode, id, errno) {
        let SQL = "UPDATE deposit SET ";
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







