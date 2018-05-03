import express from 'express';
import router from './http/routes.js';
import bodyParser from 'body-parser';

let app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.use(router);


export default app;