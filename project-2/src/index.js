const express = require("express");
const logger = require("morgan");
const path = require("path");
const cookieParser = require('cookie-parser');
const queryString = require('query-string');
const cors = require("cors");
const { google } = require("googleapis");

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

// Code for login with Google (option 1)

const redirectURI = "auth/google";
const SERVER_ROOT_URI = `http://localhost:${port}`

// // Getting login URL
// function getGoogleAuthURL() {
//   const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
//   const options = {
//     redirect_uri: `${SERVER_ROOT_URI}/${redirectURI}`,
//     client_id: process.env.GOOGLE_CLIENT_ID,
//     access_type: "offline",
//     response_type: "code",
//     prompt: "consent",
//     scope: [
//       'https://www.googleapis.com/auth/userinfo.profile',
//       'https://www.googleapis.com/auth/userinfo.email',
//     ].join(' '),
//   };

//   return `${rootUrl}?${queryString.stringify(options)}`;
// }

// console.log(`${SERVER_ROOT_URI}${redirectURI}`);
// console.log(process.env.GOOGLE_CLIENT_ID);

// app.get("/auth/google/url", (req, res) => {
//   return res.send(getGoogleAuthURL());
// })

// Getting the user from Google with the code

// Getting the current user


// Code for login with Google (option 2)

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `http://localhost:4000/oauth2callback`,
);

google.options({auth: oauth2Client});

function getGoogleAuthURL() {
  /*
   * Generate a url that asks permissions to the user's email and profile
   */
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes, // If you only need one scope you can pass it as string
  }, async () => {
    const {tokens} = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens);
  });
}

app.get("/login", (req, res) => {
  return res.render("auth.ejs")
})

app.get("/auth/google/url", (req, res) => {
  return res.redirect(getGoogleAuthURL())
  // return res.send(getGoogleAuthURL());
})

app.get("/oauth2callback", async (req, res) => {
  console.log(req.query)
  const { tokens } = await oauth2Client.getToken(req.query.code); 
  oauth2Client.credentials = tokens;

  console.log(tokens.access_token)
  console.log(oauth2Client.isTokenExpiring())

  const infoToken = await oauth2Client.getTokenInfo(tokens.access_token)
  const infoUser = await oauth2Client.verifyIdToken({ idToken: tokens.id_token })

  res.cookie("accessToken", {
    accessToken: tokens.access_token,
    idToken: tokens.id_token
  })

  return res.json({tokens, infoToken, infoUser})
})


// Other URL
const isLogin = async (req, res, next) => {
  try {
    const {accessToken} = req.cookies.accessToken;

    if(!accessToken) {
      return next('Something went wrong!');
    }

    // const infoUser = await oauth2Client.verifyIdToken({ idToken })

    const isExpired = oauth2Client.isTokenExpiring()
    if(isExpired) {
      res.redirect('/login');
    }

    const infoToken = await oauth2Client.getTokenInfo(accessToken)
    console.log(infoToken)

    req.user = infoToken.email;
    next();
  } catch (error) {
    next(error)
  }
}

app.use('/user/profile', isLogin, async (req, res, next) => {
  try {
    const user = req.user;
    console.log(user);

    return res.json({user, data: "this is data user info get from database"})
  } catch (error) {
    next(error)
  }
})


// Handle error
app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).json({ message: err.message });
})

app.listen(port, () => {
  console.log(`http://localhost:${port}`);
})