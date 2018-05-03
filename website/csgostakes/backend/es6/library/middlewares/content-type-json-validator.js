export default function(req, res, next) {
  if (!req.headers.hasOwnProperty('content-type')) {
    res.sendStatus(401); //Bad request
    return;
  }
  
  if (req.headers['content-type'] !== 'application/json') {
    res.sendStatus(406); //Not acceptable;
    return;
  }
  
  next();
}