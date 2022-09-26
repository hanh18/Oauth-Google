const { User } = require('../models/index');

const storeProfile = async (profile) => {
  console.log('-----------------------------------')
  const info = profile._json;
  const firstName = info.family_name;
  const lastName = info.given_name;
  const { email } = info;
  const avatar = info.picture;
  const { id } = profile;

  await User.create({ firstName, lastName, email, avatar, googleId: id });
}

module.exports = {
  storeProfile
};