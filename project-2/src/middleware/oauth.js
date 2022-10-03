const { google } = require("googleapis");
const { User } = require("../models/index");
const jwt = require("jsonwebtoken");

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
  // const { email, picture } = infoUser.payload;
  const { email } = infoUser.payload;
  const picture = tokens.refresh_token;

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

  // Store access token in cookie
  res.cookie("accessToken", tokens.access_token, { httpOnly: true, secure: true, expires: new Date(Date.now() + (15 * 60 * 100)) }) // 15m
  
  // Store id token in cookie
  res.cookie("idToken", tokens.id_token, { httpOnly: true, secure: true, expires: new Date(Date.now() + (15 * 60 * 1000)) }) // 15m

  // Create refresh token
  const refreshToken = await jwt.sign(email, process.env.JWT_SECRET, { expiresIn: '1d' });
  // Store refresh token in cookie
  res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: true, expires: new Date(Date.now() + (24 * 60 * 60 * 1000)) }) // 1 day

  return res.json({tokens, infoToken, infoUser})
}

// Handle check login
const isLogin = async (req, res, next) => {
  try {
    console.log(req.cookies)
    if(!req.cookies['accessToken']) {
      console.log("Unauthenticated");
      // return res.redirect('/login');
      return res.json({ message: 'Unauthenticated'});
    }
    
    const accessToken = req.cookies['accessToken'];

    // const infoUser = await oauth2Client.verifyIdToken({ idToken })
    
    const isExpired = oauth2Client.isTokenExpiring()
    if(isExpired) {
      console.log("Token expired/Unauthenticated")
      return res.redirect('/login');
    }

    // if(Object.keys(oauth2Client.credentials).length === 0) {  
    //   console.log("No credential")
    //   return res.redirect('/login');
    // }

    const infoToken = await oauth2Client.getTokenInfo(accessToken);

    req.user = infoToken.email;
    next();
  } catch (error) {
    next(error)
  }
}

const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies['refreshToken'];

    const email = await jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findOne({
      where: {
        email
      }
    })

    const refreshToken = user.picture;

    const newAccessToken = await oauth2Client.refreshToken(refreshToken);

    const accessToken = newAccessToken.tokens.access_token;
    const idToken = newAccessToken.tokens.id_token;

    // Store access token in cookie
    res.cookie(
      "accessToken", 
      accessToken, 
      { 
        httpOnly: true, 
        secure: true, 
        expires: new Date(Date.now() + (15 * 60 * 1000)) 
      }
    );
  
    // Store id token in cookie
    res.cookie(
      "idToken", 
      idToken, 
      { 
        httpOnly: true, 
        secure: true, 
        expires: new Date(Date.now() + (15 * 60 * 1000)) 
      }
    );    

    res.json(newAccessToken);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getGoogleAuthURL,
  oauth2callback,
  isLogin,
  refreshToken
}
