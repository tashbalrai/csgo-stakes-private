import express from 'express';
import Ticket from './controllers/ticket.js';
import APITokenValidator from './../../library/middlewares/api-token-validator.js';
import Uploader from './../../library/middlewares/uploader';

const uploader = Uploader('tickets');

const router = express.Router();

router.get('/',
  APITokenValidator,
  (req, res) => {
    let ticket = new Ticket(req, res);
    ticket.list();
});

router.post('/',
  APITokenValidator,
  uploader.any(),
  (req, res) => {
    let ticket = new Ticket(req, res);
   ticket.create();
});

router.get('/:id',
  APITokenValidator,
  (req, res) => {
    let ticket = new Ticket(req, res);
    ticket.get();
});


router.put('/:id',
  APITokenValidator,
  uploader.any(),
  (req, res) => {
    let ticket = new Ticket(req, res);
    ticket.reply();
  });


router.delete('/:id',
  APITokenValidator,
  (req, res) => {
    let ticket = new Ticket(req, res);
    ticket.close();
  });

export default router;