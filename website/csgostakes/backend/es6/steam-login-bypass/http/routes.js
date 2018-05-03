import express from 'express';
import Login from './controllers/login.js';

const router = express.Router();

router.get('/login/response', (req, res) => {
  let login = new Login(req, res);
  login.loginResponse();
});

router.get('/bridge', (req, res) => {
  let login = new Login(req, res);
  login.bridgeSession();
});

router.get('/print', (req, res) => {
  let login = new Login(req, res);
  login.printSession();
});

router.get('/test', (req, res) => {
  let login = new Login(req, res);
  login.test();
});

export default router;