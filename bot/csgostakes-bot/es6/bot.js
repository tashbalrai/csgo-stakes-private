'use strict';

/*
Auther: Vince
Description: A steam bot worker.

Notification message events:
master.itemscount => Bot's inventory loaded and total item count is sent to master control process.
deposit.error => Deposit error event
deposit.sent => Deposit offer was sent.
deposit.sent.canceled => For some reason sent offer was canceled due to some error in the process.
poll.failed => automatic polling failed. It could be sign of steam misbehaving right now.

*/

import config from './config.js';
import mysql from 'mysql';
import redis from 'redis';
import Debug from 'debug';
import SteamTotp from 'steam-totp';
import SteamCommunity from 'steamcommunity';
import TradeOfferManager from 'steam-tradeoffer-manager';
import SteamUser from 'steam-user';
import request from 'request';
import winston from 'winston';
import EventEmitter from 'events';
import BotEResult from './bot-eresult.js';
import crypto from 'crypto';
import Deposit from './deposit.js';
import Withdraw from './withdraw.js';
import DepositResolver from './deposit-resolver.js';

const
    client = redis.createClient(config.redis),
    botDetails = JSON.parse(process.env.bot),
    debug = Debug(`bot:${botDetails.account_name}:${botDetails.id} >`),
    OFFER_TYPES = {
        "Deposit": 1,
        "Withdraw": 2
    };


request.defaults({
    "proxy": "https://" + config.bot.proxyPort + '@' + config.bot.proxyHost
});

function sendMessage(msg) {
    if (process.connected) {
        process.send(msg);
    }
}

class Bot extends EventEmitter {
    constructor() {
        super();
        
        this.self = JSON.parse(process.env.bot);
        this.pause = false;
        this.isDisconnected = false;

        this.log = new (winston.Logger)({
            transports: [
                new (winston.transports.File)({
                    filename: '../log/bot_' + this.self.account_name + '.log',
                    maxsize: 1048576
                })
            ]
        });

        this.client = new SteamUser();
        this.offers = new TradeOfferManager({
            steam: this.client,
            domain: config.bot.domain,
            language: "en",
            pollInterval: config.bot.pollInterval,
            apiKey: config.bot.apiKey,
            cancelTime: config.bot.cancelInterval,
            pendingCancelTime: config.bot.pendingCancelInterval
        });

        client.get('polling.' + this.self.account_name + '.' + this.self.id, (err, data) => {
            if (err) {
                debug('Unable to retrieve previous poll data (%s)', 'polling.' + this.self.account_name + '.' + this.self.id);
                this.log.error(`Unable to retrieve previous poll data (polling.${this.self.account_name}.${this.self.id})`);
                return;
            }

            try {
                data = JSON.parse(data);
            } catch(e) {
                debug('Error: unable to parse poll data.');
                this.log.error('Error: unable to parse poll data.');
                this.offers.pollData = [];
                return;
            }
            
            this.offers.pollData = data || {};
        });

        this.offers.on('newOffer', (offer) => {
            debug('Direct new offer will be canceled.');
            offer.cancel((err, result) => {
                this.log.warn('Direct new offer canceled');
            });
        });

        this.offers.on('sentOfferChanged', this.sentOfferChanged.bind(this));
        this.offers.on('pollData', this.pollData.bind(this));
        this.offers.on('pollFailure', this.pollFailure.bind(this));

        this.community = new SteamCommunity({
            "request": request
        });

        this.community.on('sessionExpired', () => {
            if (!this.isDisconnected) {
                this.disconnected();
            }
        });
    }

    sentOfferChanged(offer, oldState) {
        // We won't process these offers.
        if (offer.isOurOffer == false
            || offer.state == TradeOfferManager.ETradeOfferState.Active
            || offer.state == TradeOfferManager.ETradeOfferState.CreatedNeedsConfirmation
            || offer.state == TradeOfferManager.ETradeOfferState.CanceledBySecondFactor
            || offer.state == TradeOfferManager.ETradeOfferState.InEscrow
        ) {
            return;
        }

        if (offer.state == TradeOfferManager.ETradeOfferState.Countered) {
            offer.cancel(() => {
                debug('Countered offer(%s) canceled.', offer.id);
                this.log.error(`Countered offer(${offer.id}) canceled.`);
                if (offer.data('offerType') == OFFER_TYPES.Deposit) {
                    this.deposit.handleCanceledOffer(offer);
                    return;
                } else {
                    this.withdraw.handleCanceledOffer(offer);
                    return;
                }
            });
            return;
        }

        if (offer.state == TradeOfferManager.ETradeOfferState.Canceled 
            || offer.state == TradeOfferManager.ETradeOfferState.Declined
            || offer.state == TradeOfferManager.ETradeOfferState.Expired
            || offer.state == TradeOfferManager.ETradeOfferState.Invalid
            || offer.state == TradeOfferManager.ETradeOfferState.InvalidItems
        ) {
            if (offer.data('offerType') == OFFER_TYPES.Deposit) {
                this.deposit.handleCanceledOffer(offer);
                return;
            } else {
                this.withdraw.handleCanceledOffer(offer);
                return;
            }
        }

        if (offer.isGlitched()) {
            debug('Offer %s of user %s was glitched.', offer.id, offer.data('userId'));
            this.log.error('Glitched offer. ', offer);

            sendMessage({
                "event": "offer.glitched",
                "to": "notifier",
                "data": {
                    "botId": this.self.id,
                    "userId": offer.data('userId'),
                    "offerId": offer.id,
                    "offerType": offer.data('offerType'),
                    "depositId": offer.data('depositId'),
                    "withdrawId": offer.data('withdrawId'),
                    "securityToken": offer.data('securityToken')
                }
            });

            if (offer.data('offerType') == OFFER_TYPES.Deposit) {
                this.deposit.markErrorRecord(BotEResult.GlitchedOffer, offer.data('depositId'));
                return;
            } else {
                this.withdraw.markErrorRecord(BotEResult.GlitchedOffer, offer.data('withdrawId'));
                return;
            }

            return;
        }

        if (!offer.tradeID) {
            // offer doesn't contain trade id; something bad at steam side; most probably offer will be rolled back.
            debug('Bad offer %s, offer state %s, no trade id set.', offer.id, TradeOfferManager.ETradeOfferState[offer.state]);
            this.log.error(`Bad offer ${offer.id}, offer state ${TradeOfferManager.ETradeOfferState[offer.state]}, no trade id set.`);
            sendMessage({
                "event": "offer.bad",
                "to": "notifier",
                "data": {
                    "botId": this.self.id,
                    "userId": offer.data('userId'),
                    "offerId": offer.id,
                    "offerType": offer.data('offerType'),
                    "depositId": offer.data('depositId'),
                    "withdrawId": offer.data('withdrawId'),
                    "securityToken": offer.data('securityToken')
                }                
            });

            if (offer.data('offerType') == OFFER_TYPES.Deposit) {
                this.deposit.markErrorRecord(BotEResult.NoTradeID, offer.data('depositId'));
            } else {
                this.withdraw.markErrorRecord(BotEResult.NoTradeID, offer.data('withdrawId'));
            }

            return;
        }

        let offerType = offer.data('offerType');

        if (OFFER_TYPES.Deposit == offerType) {
            if (offer.state == TradeOfferManager.ETradeOfferState.Accepted) {
                this.deposit.acceptDeposit(offer);
            } else {
                debug('Deposit(%s) offer(%s) with unknown state(%s)', offer.data('depositId'), offer.id, TradeOfferManager.ETradeOfferState[offer.state]);
                this.log.error(`Deposit(${offer.data('depositId')}) offer(${offer.id}) with unknown state(${TradeOfferManager.ETradeOfferState[offer.state]})`);
            }
        } else {
            if (offer.state == TradeOfferManager.ETradeOfferState.Accepted) {
                this.withdraw.markAccepted(offer);
            } else {
                debug('Withdraw(%s) offer(%s) with unknown state(%s)', offer.data('withdrawId'), offer.id, TradeOfferManager.ETradeOfferState[offer.state]);
                this.log.error(`Withdraw(${offer.data('withdrawId')}) offer(${offer.id}) with unknown state(${TradeOfferManager.ETradeOfferState[offer.state]})`);
            }     
        }
    }

    pollData(data) {
        client.set('polling.' + this.self.account_name + '.' + this.self.id, 
            JSON.stringify(data),
            (err, result) => {
                if (err) {
                    debug('Polling data save failed. error(%s).', err.message);
                    this.log.error('Polliing data save failed.', err);
                }
        });
    }

    pollFailure() {
        // use it to alert steam down or acting up
        sendMessage({
            "event": "poll.failed",
            "to": "notifier",
            "data": {
                "botId": this.self.id
            }            
        });
    }

    login() {
        return new Promise((resolve, reject) => {
            let options = {
                accountName: this.self.account_name,
                password: this.self.password,
                twoFactorCode: SteamTotp.getAuthCode(this.self.shared_secret),
                rememberPassword: true
            };

            this.client.logOn(options);
            this.client.on('error', this.handleError.bind(this));
            this.client.on('loggedOn', this.loggedOn.bind(this));
            this.client.on('disconnected', this.disconnected.bind(this));
            this.client.on('webSession', this.webSession.bind(this));
        });
    }

    handleError(err) {
        debug('Steam bot error (%s).', err.message);
        this.log.error('Steam bot error.', err);
    }

    loggedOn(details, parental) {
        debug('Logged on to Steam.');
    }

    disconnected(eresult, msg) {
        this.isDisconnected = true;
        setTimeout(() => {
            this.offers.shutdown();
            this.client.logOff();
            setTimeout(() => {                
                // Let the worker restart and relogin to steam after clearing all the previous data.
                process.exit();
            }, config.bot.tradeOffersShutdownWaiting);
        }, config.bot.tradeOffersShutdownWaiting);
    }

    webSession(sessionId, cookies) {
        this.offers.setCookies(cookies, (err) => {
            if (err) {
                this.handleError(err);
                return;
            }

            this.community.setCookies(cookies);
            // Remove confirmation checker and user acceptConfirmationForObject
            // this.community.startConfirmationChecker(config.bot.confirmationCheckerInterval, this.self.identity_secret);
            this.emit('webCookiesSetup');
        });
    }

    loadInventory(attempt) {
        this.offers.getInventoryContents(730, 2, true, (err, items) => {
            if (err) {
                this.log.error('Error loading own inventory.', err);
                debug('Error loading own inventory. error(%s).', err.message);

                if (attempt > config.bot.retryCount) {
                    this.disconnected(BotEResult.OwnInvLoadFailed, BotEResult[BotEResult.OwnInvLoadFailed]);
                }
                
                if (!isFinite(attempt)) {
                    attempt = 0;
                }

                setTimeout(this.loadInventory.bind(this), config.bot.retryInterval, ++attempt);
                return;
            }

            let count = items != undefined ? items.length : 0;
            
            this.self.inventory = [];

            if (count) {
                for(let i=0; i<count; i++) {
                    this.self.inventory.push(items[i].id);
                }
            }

            sendMessage({
                "to": "master.itemscount",
                "botId": this.self.id,
                "inventoryCount": this.self.inventory.length
            });

            this.botStat(1);

            this.emit('ownInventoryLoaded');
        });
    }

    botStat(status) {
        let inv = -1;
        if (this.self.inventory) {
            inv = this.self.inventory.length;
        }
        // Record the bot stats to redis
        client.set('botstats.' + this.self.account_name + '.' + this.self.id, JSON.stringify({
            "state": status,
            "inventory": inv,
            "id": this.self.id,
            "type": this.self.bot_type
        }));
    }

    pauseBot() {
        this.pause = true;
        this.botStat(0);
    }

    resumeBot() {
        this.pause = false;
        this.botStat(1);
    }

    setDepositor(deposit) {
        if (typeof deposit != 'object') {
            throw new Error('Deposit object is required.');
            return;
        }

        this.deposit = deposit;
        this.deposit.on('message', sendMessage);
    }

    setWithdrawer(withdraw) {
        if (typeof withdraw != 'object') {
            throw new Error('Withdraw object is required.');
            return;
        }

        this.withdraw = withdraw;
        this.withdraw.on('message', sendMessage);
    }

}

let bot = new Bot();
let deposit = new Deposit(bot, client);
let withdraw = new Withdraw(bot, client);
let depositResolver = new DepositResolver(bot, client, deposit);
bot.setDepositor(deposit);
bot.setWithdrawer(withdraw);

client.on('ready', () => {
    debug('Bot %s redis ready', bot.self.account_name);
    bot.login();
});

bot.on('webCookiesSetup', () => {
    debug('Trade offer manager and community setup complete.');
    bot.loadInventory();
});

bot.on('ownInventoryLoaded', () => {
    debug('Self inventory loaded.');
    
    if (!bot.deposit.isDepositProcessRunning) {
        bot.deposit.processDeposits();
    }
    
    if (!bot.deposit.isAcceptProcessRunning) {
        bot.deposit.processAcceptedItems();
    }

    if (!bot.withdraw.isAcceptProcessRunning) {
        bot.withdraw.processAcceptedWithdraws();
    }

    if (!bot.withdraw.isWithdrawProcessRunning) {
        bot.withdraw.processWithdraws();
    }
});

process.on('message', (msg) => {
    switch(msg.event) {
        case "shutdown":
            debug('Shutting down the bot worker.');
            bot.log.info('Shutting down the bot worker.');
            bot.disconnected();
            break;
        case "pause":
            bot.log.info('Bot worker is pausing now.');
            debug('Bot worker is pausing now.');
            bot.pauseBot();
            break;
        case "resume":
            bot.log.info('Bot worker is resuming now.');
            debug('Bot worker is resuming now.');
            bot.resumeBot();
            break;
        case "deposit-resolver":
            depositResolver.handleEvent(msg);
            break;
    }
});

process.on('uncaughtException', (err) => {
    debug('uncaughtException: %O', err);
    bot.log.error('uncaughtException', err);
    bot.disconnected(err);
});