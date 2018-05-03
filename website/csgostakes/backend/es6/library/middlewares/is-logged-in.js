export default function (req, res, next) {
    if(!req.user && !req.user.id) {
        res
        .status('401')
        .json({
            "status": "error",
            "response": "You must login to access this section."
        })
        .end();
        return;
    }
    next();
}