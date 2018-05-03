'use strict';

/*
Auther: Vince
Description: A offer resolver.
*/

import config from './config.js';
import mysql from 'mysql';
import Debug from 'debug';
import winston from 'winston';
import EventEmitter from 'events';
import BotEResult from './bot-eresult.js';
import TradeOfferManager from 'steam-tradeoffer-manager';


const
    botDetails = JSON.parse(process.env.bot),
    debug = Debug(`bot:${botDetails.account_name}:${botDetails.id}:resolver>`),
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
    };


export default class DepositResolver extends EventEmitter {
    constructor(bot, redis, deposit) {
        super();

        this.bot = bot;
        this.redis = redis;
        this.deposit = deposit;

        this.log = new (winston.Logger)({
            transports: [
                new (winston.transports.File)({
                    filename: '../log/bot_' + this.bot.self.account_name + '_resolver.log',
                    maxsize: 1048576
                })
            ]
        });

    }

    handleEvent(msg) {
        switch(msg.subEvent) {
            case "accepted-no-items":
                if (!msg.offerId) {
                    debug('Offer Id is required.');
                    return;
                }
                debug("%O", msg);
                this.acceptedButItemsNotReceived(msg.offerId);
            break;
        }
    }

    acceptedButItemsNotReceived(offerId) {
        this.bot.offers.getOffer(offerId, (err, offer) => {
            if (err) {
                debug('Cannot get offer(%s) error(%s)', offerId, err.message);
                this.log.error(`Cannot get offer(${offerId})`, err);
                return;
            }

            offer.getReceivedItems((err, items) => {
                debug('New items received for offer(%s) deposit(%s).', offer.id, offer.data('depositId'));
                this.log.info(`New items received for offer(${offer.id}) deposit(${offer.data('depositId')}).`, items);
                
                if (!items[0] && !items[0].id) {
                    debug('Invalid items (%O) offer(%s) deposit(%s)', items, offer.id, offer.data('depositId'));
                    this.log.error(`Invalid items offer(${offer.id}) deposit(${offer.data('depositId')})`, items);
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
                .deposit
                .updateNewItemsDeposit(offer)
                .then(done => {
                    debug('Items updated for offer(%s).', offer.id);
                    this.log.info(`Items updated for offer(${offer.id})`);
                })
                .catch(err => {
                    console.log('cannot ', offer.id, err.message);
                    debug('Cannot update offer(%s) items error(%s).', offer.id, err.message);
                    this.log.error(`Cannot update offer(${offer.id}) items.`, err);
                });
            });
        });        
    }

}







