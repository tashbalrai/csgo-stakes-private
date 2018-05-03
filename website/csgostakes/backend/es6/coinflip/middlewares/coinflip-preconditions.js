import config from './../config/config';

export default function (req, res, next) {
    if (req.body.inventory.length > config.coinflip.maxGameItems) {
        let error = new Error("Max items allowed in coinflip exceeded (CFPC01).");
        error.httpStatusCode = 200;
        error.code = "JSONRES";
        next(error);
        return;
    }

    let totalValue = 0.0;
    for(let i=0; i<req.body.inventory.length; i++) {
        totalValue += Number(req.body.inventory[i].price.safe_price);
    }

    if (totalValue < config.coinflip.minValue) {
        let error = new Error("Didn't meet the minimum coinflip value required (CFPC02).");
        error.httpStatusCode = 200;
        error.code = "JSONRES";
        next(error);
        return;
    }

    req.body.totalValue = totalValue;
    next();
    
}
