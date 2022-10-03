const { Router } = require("express");
const router = Router();

const { getGoogleAuthURL, oauth2callback, refreshToken } = require("../middleware/oauth");


router.get('/login', (req, res) => {
  return res.redirect(getGoogleAuthURL());
})

router.get("/auth/google/url", (req, res) => {
  return res.redirect(getGoogleAuthURL());
})

router.get("/oauth2callback", oauth2callback)

router.get("/refresh", refreshToken)

module.exports = router;