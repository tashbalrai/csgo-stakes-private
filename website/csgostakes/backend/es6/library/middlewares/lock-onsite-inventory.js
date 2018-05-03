import config from './../../user/config/config';
import Mysql from 'mysql';

export default function (req, res, next) {
    if (!Array.isArray(req.body.items) || req.body.items.length <= 0) {
        let error = new Error("Inventory items not found (LOI01).");
        error.httpStatusCode = 400;
        error.revertLockedToActive = true;
        error.code = "JSONRES";
        next(error);
        return;
    }

    if (!req.user || !req.user.id) {
        let error = new Error("Please login and retry (LOI02).");
        error.httpStatusCode = 200;
        error.revertLockedToActive = true;
        error.code = "JSONRES";
        next(error);
        return;
    }
    
    let db = Mysql.createConnection(config.mysql);
    db.query('SELECT count(*) AS total_items FROM inventory WHERE user_id = ? AND state = ? AND id IN ?',
    [req.user.id, config.itemStates.active, [req.body.items]],
    (err, result) => {

        if (err) {
            db.end();
            console.log(err);

            let error = new Error("Unknown error occurred. Please try again later (LOI03).");
            error.internalError = err;
            error.httpStatusCode = 500;
            error.revertLockedToActive = true;
            error.code = "JSONRES";
            next(error);
            return;
        }

        if (result[0].total_items != req.body.items.length) {
            db.end();
 
            let error = new Error("Some of the items are not available (LOI04).");
            error.httpStatusCode = 200;
            error.revertLockedToActive = true;
            error.code = "JSONRES";
            next(error);
            return;
        }

        db.query('UPDATE inventory SET state = ? WHERE user_id = ? AND state = ? AND id IN ?',
        [config.itemStates.locked, req.user.id, config.itemStates.active, [req.body.items]],
        (err, lResult) => {
            db.end();

            if (err) {
                console.log(err);
                let error = new Error("Unknown error occurred. Please try again later (LOI05).");
                error.internalError = err;
                error.httpStatusCode = 200;
                error.code = "JSONRES";
                next(error);
                return;
            }

            if (lResult.changedRows != req.body.items.length) {
                let error = new Error("Some unexpected happened during inventory locking. Please contact administrator (IR-LOI06).");
                error.httpStatusCode = 200;
                error.code = "JSONRES";
                next(error);
                return;
            } else {
                next();
            }
        });
    });
}
