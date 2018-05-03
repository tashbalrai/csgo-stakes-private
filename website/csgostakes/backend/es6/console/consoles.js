import SteamlyticsPrices from './steamlytics/steamlytics-prices.js';
import CheckExpiredCoinflips from './coinflip/check-expired-coinflips.js';
import FinalizeCoinflips from './coinflip/finalize-coinflips.js';
import Giveaway from './giveaway/giveaway.js';
import winston from 'winston';

export default () => {
  console.log('Setting up consoles.');
  const log = new (winston.Logger)({
    transports: [
        new (winston.transports.File)({
            filename: __dirname + '/../../logs/console_error.log',
            maxsize: 1048576
        })
    ]
  });
  
  // Fetch item prices from steamlytics every 6 hours.
  setInterval(() => {
    const steamlyticsPrices = new SteamlyticsPrices(log);
    steamlyticsPrices.cachePrice();
  }, 21600000);
  
  // Check expired games and deleted them; run every 1 minutes.
  setInterval(() => {
    const checkExpiredCoinflips = new CheckExpiredCoinflips(log);
    checkExpiredCoinflips.checkIfGameExpired();
  }, 60000);
  
  // Init finalize coinflip games
  (new FinalizeCoinflips(log)).checkIfWinnersCalculated();

  // Giveaway announcer and setup
  setInterval(() => {
    const giveaway = new Giveaway(log);
    giveaway.checkIfGiveawayExpired();
  }, 60000);

  // Giveaway item expirer ever 30 minutes
  setInterval(() => {
    const giveaway = new Giveaway(log);
    giveaway.checkIfUserItemExpired();
  }, 1800000);
}