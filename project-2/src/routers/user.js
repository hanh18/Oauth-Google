const { Router } = require("express");
const router = Router();

const { User } = require("../models/index");

router.get('/profile', async (req, res, next) => {
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

module.exports = router;