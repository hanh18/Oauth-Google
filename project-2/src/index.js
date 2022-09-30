const express = require("express");
const logger = require("morgan");
const path = require("path");
const cookieParser = require('cookie-parser');
const queryString = require('query-string');
const cors = require("cors");
const { google } = require("googleapis");

const { User } = require("../src/models/index");

require('dotenv').config();

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

// oauth2Client.on('tokens', (tokens) => {
//   if (tokens.refresh_token) {
//     // store the refresh_token in my database!
//     console.log(tokens.refresh_token);
//   }
//   console.log(tokens.access_token);
// });

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
  return res.redirect(getGoogleAuthURL());
})

app.get("/oauth2callback", async (req, res) => {
  // console.log(req.query)
  const { tokens } = await oauth2Client.getToken(req.query.code); 
  oauth2Client.credentials = tokens;
  
  const infoToken = await oauth2Client.getTokenInfo(tokens.access_token)
  const infoUser = await oauth2Client.verifyIdToken({ idToken: tokens.id_token })

  const lastName = infoUser.payload.family_name;
  const firstName = infoUser.payload.given_name;
  const verify = infoUser.payload.email_verified;
  const { email, picture } = infoUser.payload;

  console.log(email)

  const existUser = await User.findOne({
    where: {
      email
    }
  })

  if(!existUser) {
    // create new user
    await User.create({ firstName, lastName, email, picture, verify });
  } else {
    // user exist, update info user
    await User.update(
      {
        firstName, lastName, email, picture, verify
      },
      {
        where: { email },
      }
    )
  }

  res.cookie("accessToken", {
    accessToken: tokens.access_token,
    idToken: tokens.id_token
  })

  return res.json({tokens, infoToken, infoUser})
})


// Other URL
const isLogin = async (req, res, next) => {
  try {
    if(!req.cookies.accessToken) {
      return next(new Error('Something went wrong! Please login!'));
    }

    const { accessToken } = req.cookies.accessToken;

    // const infoUser = await oauth2Client.verifyIdToken({ idToken })
    
    const isExpired = oauth2Client.isTokenExpiring()
    if(isExpired) {
      return res.redirect('/login');
    }

    if(Object.keys(oauth2Client.credentials).length === 0) {  
      return res.redirect('/login');
    }

    const infoToken = await oauth2Client.getTokenInfo(accessToken);

    req.user = infoToken.email;
    next();
  } catch (error) {
    next(error)
  }
}

app.use('/user/profile', isLogin, async (req, res, next) => {
  try {
    const email = req.user;
    console.log(email);

    const profile = await User.findOne({
      where: {
        email
      }
    })

    return res.json({ profile })
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