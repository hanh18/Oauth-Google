const expressSession = require('express-session');
const SessionStore = require('express-session-sequelize')(expressSession.Store);

const Sequelize = require('sequelize');
const myDatabase = new Sequelize(
  "oauth_gg", 
  "root", 
  'hanhha', 
  {
    host: 'localhost',
    dialect: 'mysql',
  }
);

console.log("Database connected");

const sequelizeSessionStore = new SessionStore({
	db: myDatabase,
  // expiration: 24 * 60 * 60 * 1000
});

module.exports = sequelizeSessionStore;