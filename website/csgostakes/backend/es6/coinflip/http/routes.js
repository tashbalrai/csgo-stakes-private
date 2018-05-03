import express from 'express';
import Index from './controllers/index.js';
import History from './controllers/history.js';
import APITokenValidator from './../../library/middlewares/api-token-validator.js';
import ContentTypeJSONValidator from './../../library/middlewares/content-type-json-validator.js';
import InventoryItemsPrice from './../middlewares/inventory-items-price.js';
import CoinflipPreConditions from './../middlewares/coinflip-preconditions.js';
import OnsiteInventoryLimiter from './../middlewares/onsite-inventory-limiter.js';
import GameJoinLock from './../middlewares/game-join-lock.js';
import CoinflipJoinPriceRange from './../middlewares/coinflip-join-price-range.js';
import LockOnsiteInventory from './../../library/middlewares/lock-onsite-inventory.js';
import LoadGameFromRedis from './../middlewares/load-game-from-redis.js';

// Error Handlers
import EhandlerJSONResponse from './../middlewares/ehandler-json-response.js';
import EhandlerLogError from './../middlewares/ehandler-log-error.js';
import EhandlerRevertGameActive from './../middlewares/ehandler-revert-game-to-active.js';

const router = express.Router();

router.post('/create', 
  ContentTypeJSONValidator, 
  APITokenValidator,
  OnsiteInventoryLimiter, //Limit users to have only 50 items in onsite inventory
  InventoryItemsPrice, //Fetch the items from the onsite and calculate price and totalValue
  CoinflipPreConditions, 
  LockOnsiteInventory,  //Lock the onsite inventory so that user cannot use it futher until operation completes
  (req, res) => {
   let index = new Index(req, res);
   index.create();
});

router.post('/join', 
  ContentTypeJSONValidator, 
  APITokenValidator,
  OnsiteInventoryLimiter,
  InventoryItemsPrice,
  CoinflipPreConditions,
  LoadGameFromRedis,
  CoinflipJoinPriceRange,
  GameJoinLock,  
  LockOnsiteInventory,
  (req, res) => {
  let index = new Index(req, res);
  index.join();
});

router.get('/games', 
  // APITokenValidator,
  (req, res) => {
  let index = new Index(req, res);
  index.list();
});

router.get('/history', 
APITokenValidator,
(req, res) => {
  let history = new History(req, res);
  history.getLast50Coinflips();
});

router.use([
  EhandlerJSONResponse,
  EhandlerRevertGameActive,   
  EhandlerLogError
]);

export default router;