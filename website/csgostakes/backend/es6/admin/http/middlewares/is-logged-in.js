export default function(req, res, next) {
    if (req.session 
        && (!req.session.admin
        || !req.session.admin.user)
    ) {
        req.session.admin = {
            "error": {
                "message": "Unauthorized access is not permitted. Please make sure you are logged in with appropriate access rights."
            }
        };

        res.redirect('/admin/');
        return
    }

    next();
}