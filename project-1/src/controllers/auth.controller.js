const { User } = require('../models/index');

const getPage = async (req, res, next) => {
  try {
    const users = await User.findAll();
    res.status(200).json({ message: "Success", users});
  } catch (error) {
    next(error);
  }
}

const signup = async (req, res, next) => {
  try {
    res.status(200).json({ message: "Sign Up"});
  } catch (error) {
    next(error);
  }
}

const signin = async (req, res, next) => {
  try {
    res.status(200).json({ message: "Sign In"});
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getPage,
  signup,
  signin
}