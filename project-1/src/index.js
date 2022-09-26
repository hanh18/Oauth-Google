const express = require("express");
const logger = require("morgan");
const path = require("path");
const session = require('express-session');
const passport = require('passport');

require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

const routerAuth = require('./routers/auth');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(session({
  resave: false,
  saveUninitialized: true,
  secret: process.env.SESSION_SECRET
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', routerAuth);

app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).json({ message: err.message });
})

/*  PASSPORT SETUP  */
let userProfile;

app.use(passport.initialize());
app.use(passport.session());

app.get('/success', (req, res) => res.json({userProfile}));
app.get('/error', (req, res) => res.send("error logging in"));

passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});

/*  Google AUTH  */
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const GOOGLE_CLIENT_ID = process.env.GG_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GG_CLIENT_SECRET;

passport.use(new GoogleStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: `http://localhost:${port}/auth/google/callback`
},
function(accessToken, refreshToken, profile, done) {
    userProfile=profile;
    return done(null, userProfile);
}
));

app.get('/auth/google',
  passport.authenticate('google', { scope:
      [ 'email', 'profile' ] }
));
 
app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/error' }),
  function(req, res) {
    // Successful authentication, redirect success.
    res.redirect('/success');
});

app.listen(port, () => {
  console.log(`http://localhost:${port}`);
})