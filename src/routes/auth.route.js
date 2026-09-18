import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import passport from "passport";
import { Router } from "express";
import jsonwebtoken from "jsonwebtoken";
import { logger } from "../config/pino.config.js";
import { HttpStatus } from "../enum/http-status.js";
import { UserModel } from "../model/user.model.js";
import * as helper from "../utils/helper.js";
import * as common from "../utils/commons.js";
import { appConfig } from "../config/app.config.js";
import { AuthType } from "../enum/auth-type.js";
import { agenda } from "../config/agenda.config.js";
import { AgendaJobs } from "../enum/agenda-jobs.js";
import { TokenModel } from "../model/token.model.js";
import otpTokeniddleware from "../middleware/otp-token.middleware.js";
import {
  facebookMiddleware,
  googleMiddleware,
  refreshMiddleware,
} from "../middleware/jwt.middleware.js";

const route = Router();
const bcryptRounds = 5;
const cookieOptions = {
  httpOnly: true,
  maxAge: 1000 * 60 * 15,
  path: "/",
  secure: true,
};

route.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body ?? {};
    if (!name || !email || !password)
      return res
        .status(HttpStatus.ERROR)
        .json({ message: "Not all the required fields are provided" });
    const userEntry = await UserModel.find({ email }).lean();
    if (userEntry.length)
      return res
        .status(HttpStatus.OK)
        .json({ message: "User with the same email already exists" });
    const bcryptPass = await bcrypt.hash(password, bcryptRounds);
    const randomId = helper.randomIdGen().toString();
    await UserModel.insertOne({
      name,
      email,
      password: bcryptPass,
      user_id: randomId,
    });
    return res
      .status(HttpStatus.OK)
      .json({ message: "User created with success" });
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

route.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password)
      return res
        .status(HttpStatus.ERROR)
        .json({ message: "No email or password provided" });
    const userData = await UserModel.findOne({ email }).lean();
    if (!userData)
      return res
        .status(HttpStatus.ERROR)
        .json({ message: "User not registered" });
    const hashedPass = userData?.password ?? "";
    const compare = await bcrypt.compare(password, hashedPass);
    if (!compare)
      return res
        .status(HttpStatus.UN_AUTHORIZED)
        .json({ message: "UnAuthorized" });
    const payload = { id: userData._id.toString() };
    const options = {
      expiresIn: "15m",
      algorithm: "HS256",
    };
    const token = jwt.sign(payload, appConfig.jwtSecret, options);
    res.cookie("token", token, cookieOptions);
    return res
      .status(HttpStatus.OK)
      .json({ message: "Logging in with success" });
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

route.get("/refresh", refreshMiddleware, async (req, res) => {
  try {
    const { id = "" } = req.userData || {};
    if (!id)
      return res
        .status(HttpStatus.UN_AUTHORIZED)
        .json({ message: "Invalid refresh token" });
    const userData = await UserModel.findOne({
      _id: new mongoose.Types.ObjectId(id),
    }).lean();
    if (!userData)
      return res
        .status(HttpStatus.UN_AUTHORIZED)
        .json({ message: "Invalid refresh token" });
    const payload = { id: userData._id.toString() };
    const options = {
      expiresIn: "15m",
      algorithm: "HS256",
    };
    const token = jwt.sign(payload, appConfig.jwtSecret, options);
    res.cookie("token", token, cookieOptions);
    return res
      .status(HttpStatus.OK)
      .json({ message: "Refresh token sent with success" });
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

route.get("/auth-failure", async (req, res) => {
  return res
    .status(HttpStatus.ERROR)
    .json({ message: "Failed to authenticate" });
});

route.get(
  "/google-passport",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);
route.get("/google/callback", googleMiddleware, async (req, res) => {
  try {
    const { email } = req?.userData ?? {};
    if (!email)
      return res
        .status(HttpStatus.UN_AUTHORIZED)
        .json({ message: "Malformed profile body from google" });
    const payload = { email };
    const options = {
      expiresIn: "15m",
      algorithm: "HS256",
    };
    const token = jwt.sign(payload, appConfig.jwtSecret, options);
    res.cookie("token", token, cookieOptions);
    return res.redirect(appConfig.redirectUrl);
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

route.get(
  "/facebook-passport",
  passport.authenticate("facebook", { scope: ["profile", "email"] }),
);
route.get("/facebook/callback", facebookMiddleware, async (req, res) => {
  try {
    const { email } = req ?? {};
    if (!email)
      return res
        .status(HttpStatus.UN_AUTHORIZED)
        .json({ message: "Malformed profile body from google" });
    const payload = { email };
    const options = {
      expiresIn: "15m",
      algorithm: "HS256",
    };
    const token = jwt.sign(payload, appConfig.jwtSecret, options);
    res.cookie("token", token, cookieOptions);
    return res.redirect(appConfig.redirectUrl);
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
