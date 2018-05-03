import config from './../../config/config.js';

config.depositStates = {
    "error": 0,
    "queued": 1,
    "offerSent": 2,
    "offerAccepted": 3,
    "itemsAssigned": 4,

    "0": "Error",
    "1": "Queued",
    "2": "Offer sent",
    "3": "Offer accepted",
    "4": "Items assigned"
};

config.itemStates = {
    "inActive": 0,
    "active": 1,
    "locked": 2,
    "inGame": 3,
    "withdrawn": 4,
    "queuedForWithdraw": 5,

    "0": "Inactive",
    "1": "Active",
    "2": "Locked",
    "3": "In Game",
    "4": "Withdrawn",
    "5": "Queued for withdraw"
};

config.withdrawStates = {
    "error": 0,
    "queued": 1,
    "offerSent": 2,
    "offerAccepted": 3,
    "itemsDeassigned": 4,

    "0": "Error",
    "1": "Queued",
    "2": "Offer Sent",
    "3": "Offer Accepted",
    "4": "Items Deassigned"
};

config.userRoles = {
    "normal": 1,
    "chatAdmin": 2,
    "commission": 3
};

export default config;
  