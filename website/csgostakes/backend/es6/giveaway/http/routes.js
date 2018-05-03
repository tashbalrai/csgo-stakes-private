import express from 'express';
import Giveaway from './controllers/giveaway.js';

const router = express.Router();

router.get('/active', (req, res) => {
  let giveaway = new Giveaway(req, res);
  giveaway.getActiveGiveaway();
});

export default router;