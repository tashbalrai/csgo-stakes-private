"use strict";

import express from 'express';
import isLoggedIn from './middlewares/is-logged-in.js';
import Index from './controllers/index.js';
import Bots from './controllers/bots.js';
import Users from './controllers/users';
import Ticket from './controllers/ticket';

const router = express.Router();

router.get('/', (req, res) => {
  let index = new Index(req, res);
  index.index();
});

router.get('/logout', isLoggedIn, (req, res) => {
  let index = new Index(req, res);
  index.logout();
});

router.get('/dashboard', isLoggedIn, (req, res) => {
  let index = new Index(req, res);
  index.dashboard();
});

router.post('/process/login', (req, res) => {
  let index = new Index(req, res);
  index.processLogin();
});

router.get('/bots', isLoggedIn, (req, res) => {
  let bots = new Bots(req, res);
  bots.list();
});

router.get('/bots/new', isLoggedIn, (req, res) => {
  let bots = new Bots(req, res);
  bots.view();
});

router.get('/bots/edit/:botId', isLoggedIn, (req, res) => {
  let bots = new Bots(req, res);
  bots.view();
});

router.get('/bots/redsync', isLoggedIn, (req, res) => {
  let bots = new Bots(req, res);
  bots.redisSync();
});

router.get('/bots/remove', isLoggedIn, (req, res) => {
  let bots = new Bots(req, res);
  bots.remove();
});

router.post('/bots/:id/pause', isLoggedIn, (req, res) => {
  let bots = new Bots(req, res);
  bots.pause();
});

router.post('/bots/:id/resume', isLoggedIn, (req, res) => {
  let bots = new Bots(req, res);
  bots.resume();
});

router.post('/bots/:id/activate', isLoggedIn, (req, res) => {
  let bots = new Bots(req, res);
  bots.activate();
});

router.post('/bots/:id/deactivate', isLoggedIn, (req, res) => {
  let bots = new Bots(req, res);
  bots.deactivate();
});

router.post('/bots/save', isLoggedIn, (req, res) => {
  let bots = new Bots(req, res);
  bots.save();
});

router.get('/users', isLoggedIn, (req, res) => {
  const users = new Users(req, res);
  users.list();
});

router.get('/users/:id', isLoggedIn, (req, res) => {
  const users = new Users(req, res);
  users.view();
});

router.get('/tickets/:type', isLoggedIn, (req, res) => {
  const ticket = new Ticket(req, res);
  ticket.list();
});

router.get('/tickets/view/:id', isLoggedIn, (req, res) => {
  const ticket = new Ticket(req, res);
  ticket.view();
});

router.post('/tickets/:id', isLoggedIn, (req, res) => {
  const ticket = new Ticket(req, res);
  ticket.save();
});

router.delete('/tickets/:id', isLoggedIn, (req, res) => {
  const ticket = new Ticket(req, res);
  ticket.close();
});

router.use((req, res, next)=>{
  res.status(404).render('404');
});

export default router;