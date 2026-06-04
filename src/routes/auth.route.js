import bcrypt from "bcrypt";
import { Router } from "express";
import jsonwebtoken from "jsonwebtoken";
import { logger } from "../config/pino.config.js";
import { HttpStatus } from "../enum/http-status.js";
import { UserModel } from "../model/user.model.js";
import * as helper from "../utils/helper.js";
import * as common from "../utils/commons.js";
import { appConfig } from "../config/app.config.js";
import { passport } from "../config/passport.config.js";

const route = Router();
const bcryptRounds = 5;

// Register the user using email
route.post("/email-auth-register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (
      !name ||
      !email ||
      !password ||
      name === "" ||
      email === "" ||
      password === ""
    )
      return res
        .status(HttpStatus.ERROR)
        .json({ message: "Not all fields were provided" });
    const userEtnry = await common.findUserByEmail(email);
    if (userEtnry.length)
      return res
        .status(HttpStatus.ERROR)
        .json({ message: "User already exists with teh given email id" });
    const newUuid = helper.genUuid();
    const salt = await bcrypt.genSalt(bcryptRounds);
    const hashedPass = await bcrypt.hash(password, salt);
    await UserModel.insertOne({ name, email, password: hashedPass });
    return res
      .status(HttpStatus.OK)
      .json({ message: "User registered with success" });
  } catch (err) {
    logger.error({
      url: req.originalUrl,
      method: req.method,
      body: req.body,
      stack: err.stack,
    });
    return res
      .status(HttpStatus.ERROR)
      .json({ message: "Something went wrong" });
  }
});

// email login
route.post("/email-auth-login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password || email === "" || password === "")
      return res
        .status(HttpStatus.ERROR)
        .json({ message: "Not all fields were provided" });
    const userArr = await common.findUserByEmail(email);
    if (!userArr.length)
      return res.status(HttpStatus.ERROR).json({ message: "No user found" });
    const hashedPass = userArr[0].password || "";
    const result = await bcrypt.compare(password, hashedPass);
    if (!result)
      return res
        .status(HttpStatus.ERROR)
        .json({ message: "Wrong email id or password" });
    const payload = {
      id: userArr[0]._id.toString(),
    };
    const token = await jsonwebtoken.sign(payload, appConfig.jwtSecret, {
      expiresIn: "1d",
      algorithm: "HS512",
    });
    return res.status(HttpStatus.OK).json({ token });
  } catch (err) {
    logger.error({
      url: req.originalUrl,
      method: req.method,
      body: req.body,
      stack: err.stack,
    });
    return res
      .status(HttpStatus.ERROR)
      .json({ message: "Something went wrong" });
  }
});

// This will initiate the login
route.get(
  "/google-auth",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

// Handle the token expiry logic in here
route.get("/email-auth-refresh", async (req, res) => {
  try {
    // Add something in here
  } catch (err) {
    logger.error({
      url: req.originalUrl,
      method: req.method,
      body: req.body,
      stack: err.stack,
    });
    return res
      .status(HttpStatus.ERROR)
      .json({ message: "Something went wrong" });
  }
});

export { route };
