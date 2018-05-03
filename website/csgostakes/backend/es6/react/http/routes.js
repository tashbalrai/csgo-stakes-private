import express from 'express';
import Index from './controllers/index.js';

const router = express.Router();

router.get('/', (req, res) => {
  let index = new Index(req, res);
  index.index();
});

router.get('*', (req, res) => {
  let index = new Index(req, res);
  index.index();
});

export default router;