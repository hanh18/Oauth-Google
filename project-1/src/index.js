const express = require("express");
const logger = require("morgan");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

const routerAuth = require('./routers/auth');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', routerAuth);

app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).json({ message: err.message });
})

app.listen(port, () => {
  console.log(`http://localhost:${port}`);
})