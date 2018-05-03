import config from './../config/config';

export default function (err, req, res, next) {
    if (err.internalError) {
        console.log(err.internalError);
    }

    next(err);
}
