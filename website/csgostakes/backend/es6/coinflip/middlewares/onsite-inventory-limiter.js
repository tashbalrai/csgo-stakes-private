import config from './../config/config';
import Mysql from 'mysql';

const INVENTORY_LIMIT = 50;

export default function (req, res, next) {
    let db = Mysql.createConnection(config.mysql);
    
    db.query('SELECT count(*) AS total_inventory FROM inventory WHERE user_id = ? AND state = 1',
    [req.user.id], 
    (err, result) => {
        db.end();

        if (err) {
            let error = new Error("Unknown error occurred. Please try again later (OIL01).");
            error.httpStatusCode = 500;
            error.code = "JSONRES";
            next(error);
            return;
        }

        // Maximum of 50 inventory items are allowed per account.
        if (result[0].total_inventory >= INVENTORY_LIMIT) {
            let error = new Error("Onsite inventory limit reached. Try withdrawing some items before playing (OIL02)");
            error.httpStatusCode = 200;
            error.code = "JSONRES";
            next(error);
            return;
        } else {
            next();
        }
    });
        
}
