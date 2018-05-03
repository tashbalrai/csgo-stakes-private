import express from 'express';
import router from './http/routes.js';
import passport from 'passport';
import passportSteam from 'passport-steam';
import bodyParser from 'body-parser';
import config from './../config/config.js';

let app = express();
const SteamStrategy = passportSteam.Strategy;

app.use(express.static('./steam-login-by-pass/public'));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(new SteamStrategy(config.passport.steam,
  function(identifier, profile, done) {
    process.nextTick(function () {
      profile.identifier = identifier;
      return done(null, profile);
    });
  }
));

app.use(passport.initialize());
app.use(passport.session());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

app.get('/login',
  passport.authenticate('steam', { failureRedirect: '/error' }),
  function(req, res) {
    res.redirect('/slbp/');
});

app.get('/return',
  passport.authenticate('steam', { failureRedirect: '/error' }),
  function(req, res) {
    res.redirect('/slbp/login/response');
});

app.use(router);

export default app;