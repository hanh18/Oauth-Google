import express, { Request, Response, NextFunction } from "express";
import logger from "morgan";
import path from "path";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";

const app = express();
dotenv.config();

const port = 4040;

app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.log(err);
  res.status(500).json({ message: err.message });
});

app.listen(port, () => {
  console.log(`http://localhost:${port}`);
});
