const { google } = require("googleapis");
const { User } = require("../models/index");

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `http://localhost:4000/oauth2callback`,
);

google.options({auth: oauth2Client});

const getGoogleAuthURL = () => {
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

const oauth2callback = async (req, res) => {
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
    // if the user doesn't exist, create new user
    await User.create({ firstName, lastName, email, picture, verify });
  } else {
    // if user exist, update info user
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
}

// Handle check login
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

module.exports = {
  getGoogleAuthURL,
  oauth2callback,
  isLogin
}
