const express = require("express");
const logger = require("morgan");
const path = require("path");
const cookieParser = require('cookie-parser');
const queryString = require('query-string');
const cors = require("cors");

require("dotenv").config();

const config = require('./config/configServer');

const app = express();
const port = process.env.PORT || 3000;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/', (req, res) => res.json("Hi !!!"))

// Code for login with Google

const redirectURI = "auth/google";
const SERVER_ROOT_URI = `http://localhost:${port}`

// Getting login URL
function getGoogleAuthURL() {
  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  const options = {
    redirect_uri: `${SERVER_ROOT_URI}/${redirectURI}`,
    client_id: process.env.GOOGLE_CLIENT_ID,
    access_type: "offline",
    response_type: "code",
    prompt: "consent",
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ].join(' '),
  };

  return `${rootUrl}?${queryString.stringify(options)}`;
}

console.log(`${SERVER_ROOT_URI}${redirectURI}`);
console.log(process.env.GOOGLE_CLIENT_ID);

app.get("/auth/google/url", (req, res) => {
  return res.send(getGoogleAuthURL());
})

// Getting the user from Google with the code

// Getting the current user


app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).json({ message: err.message });
})

app.listen(port, () => {
  console.log(`http://localhost:${port}`);
})