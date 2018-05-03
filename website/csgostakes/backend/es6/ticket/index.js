import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import router from './http/routes.js';

let app = express();
app.use('/files', express.static(path.resolve(__dirname, '../../../uploads/tickets')));
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.use(router);


export default app;