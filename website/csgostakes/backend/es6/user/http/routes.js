import express from 'express';
import User from './controllers/user.js';
import Inventory from './controllers/inventory.js';
import History from './controllers/history.js';
import APITokenValidator from './../../library/middlewares/api-token-validator.js';
import ContentTypeJSONValidator from './../../library/middlewares/content-type-json-validator.js';
import SteamInventoryRateLimiter from './../../library/middlewares/inventory-rate-limiter.js';
import SteamItemsPrice from './../middlewares/steam-items-price.js';
import WithdrawRateLimit from './../middlewares/withdraw-rate-limiter.js';
import LockOnsiteInventory from './../../library/middlewares/lock-onsite-inventory.js';

const router = express.Router();

router.get('/tradeurl',
  APITokenValidator,
  (req, res) => {
    let user = new User(req, res);
    user.getTradeUrl();
});

router.post('/tradeurl/save', 
  ContentTypeJSONValidator, 
  APITokenValidator,
  (req, res) => {
   let user = new User(req, res);
   user.updateTradeUrl();
});

router.get('/steam/inventory',
  APITokenValidator,
  SteamInventoryRateLimiter,
  (req, res) => {
    let inventory = new Inventory(req, res);
    inventory.getUserSteamInventory();
});

router.post('/auth', 
  ContentTypeJSONValidator, 
  APITokenValidator, 
  (req, res) => {
    let user = new User(req, res);
    user.authenticate();
});

router.post('/logout', 
  ContentTypeJSONValidator, 
  APITokenValidator, 
  (req, res) => {
    let user = new User(req, res);
    user.logoutAPI();
});

router.get('/logout', (req, res) => {
  let user = new User(req, res);
  user.logoutSession();
});

router.post('/inventory/deposit', 
  ContentTypeJSONValidator, 
  APITokenValidator,
  SteamItemsPrice,
  (req, res) => {
    let inventory = new Inventory(req, res);
    inventory.deposit();
});

router.get('/inventory/deposit/pending',
  APITokenValidator,
  (req, res) => {
    let inventory = new Inventory(req, res);
    inventory.pendingDeposits();
});

router.post('/inventory/withdraw', 
  ContentTypeJSONValidator, 
  APITokenValidator,
  WithdrawRateLimit,
  LockOnsiteInventory,
  (req, res) => {
    let inventory = new Inventory(req, res);
    inventory.withdraw();
});

router.get('/inventory/onsite',
  APITokenValidator,
  (req, res) => {
    let inventory = new Inventory(req, res);
    inventory.getOnsiteInventory();
});

router.get('/history/deposit',
  APITokenValidator,
  (req, res) => {
    let history = new History(req, res);
    history.depositHistory();
});

router.get('/history/withdraw',
  APITokenValidator,
  (req, res) => {
    let history = new History(req, res);
    history.withdrawHistory();
});

router.get('/history/coinflips',
  APITokenValidator,
  (req, res) => {
    let history = new History(req, res);
    history.coinflipHistory();
  });

export default router;