const express = require("express");
const logger = require("morgan");
const path = require("path");
const cookieParser = require('cookie-parser');
const cors = require("cors");

const authRouter = require("./routers/auth");
const userRouter = require("./routers/user");
const { isLogin } = require("./middleware/oauth");

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

app.use('/', authRouter);
app.use('/user', isLogin, userRouter)

// Handle error
app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).json({ message: err.message });
})

app.listen(port, () => {
  console.log(`http://localhost:${port}`);
})