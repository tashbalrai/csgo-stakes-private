import config from './../config/config';
import Mysql from 'mysql';

export default function (err, req, res, next) {
    if (err.code == "JSONRES") {
        res
        .status(err.httpStatusCode)
        .json({
            "status": "error",
            "response": err.message
        });
    }
    
    next(err);
}
