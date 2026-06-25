import bcrypt from "bcrypt";
import { Router } from "express";
import jsonwebtoken from "jsonwebtoken";
import { logger } from "../config/pino.config.js";
import { HttpStatus } from "../enum/http-status.js";
import { UserModel } from "../model/user.model.js";
import * as helper from "../utils/helper.js";
import * as common from "../utils/commons.js";
import { appConfig } from "../config/app.config.js";
import { googleConf as googleClient } from "../config/google-client.config.js";
import { AuthType } from "../enum/auth-type.js";
import { agenda } from "../config/agenda.config.js";
import { AgendaJobs } from "../enum/agenda-jobs.js";
import otpTokeniddleware from "../middleware/otp-token.middleware.js";
import { TokenModel } from "../model/token.model.js";
import mongoose from "mongoose";

const route = Router();
const bcryptRounds = 5;

// Register the user using email
route.post("/email-auth-register", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
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
// Need to make sure so that only one otp will be send till the otp is not expired
route.post("/email-auth-login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
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
    let promiseArr = [];
    const otpId = helper.genUuid();
    const otpToken = helper.genOtpToken();
    const tokenEntry = await TokenModel.insertOne({
      uuid: otpId,
      otp: otpToken
    });
    const payload ={
      tokenId: otpId
    };
    promiseArr.push(
      agenda.now(AgendaJobs.otpService, {
        to: email,
        tokenId: tokenEntry._id.toString(),
        otpToken
      }),
    );
    promiseArr.push(
      jsonwebtoken.sign(payload, appConfig.otpSecret, {
        expiresIn: "10m",
        algorithm: "HS512",
      }),
    );
    const [_, token] = await helper.promiseCaller(promiseArr);
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

// Verify the user and provide the original jwt token
route.post("/email-otp-verify", otpTokeniddleware, async (req, res) => {
  try {
    const { otp } = req.body || {};
    const userData = req.userData || null;
    if (!userData)
      return res
        .status(HttpStatus.ERROR)
        .json({ message: "Email OTP not verified" });
    const payload = {
      id: userData._id.toString(),
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

// Refresh token api
route.get("/auth-refresh", async (req, res) => {
  const token = req.headers.authorization?.split("Bearer ")[1] || "";
  try {
    const result = jsonwebtoken.verify(token, appConfig.jwtSecret);
    if (!result) {
      return res
        .status(HttpStatus.UN_AUTHORIZED)
        .json({ message: "UnAuthorized" });
    }
    const { id } = result;
    const user = await UserModel.findOne({
      _id: new mongoose.Types.ObjectId(id),
    }).lean();
    if (user) {
      const payload = { id: user._id.toString() };
      const refresh = jsonwebtoken.sign(payload, appConfig.jwtSecret, {
        expiresIn: "1d",
        algorithm: "HS512",
      });
      return res.status(HttpStatus.OK).json({ token: refresh });
    } else {
      return res
        .status(HttpStatus.UN_AUTHORIZED)
        .json({ message: "UnAuthorized" });
    }
  } catch (err) {
    if (err instanceof jsonwebtoken.TokenExpiredError) {
      const result = jsonwebtoken.verify(token, appConfig.jwtSecret, {
        ignoreExpiration: true,
      });
      if (!result) {
        return res
          .status(HttpStatus.UN_AUTHORIZED)
          .json({ message: "UnAuthorized" });
      }
      const { id } = result;
      const user = await UserModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
      }).lean();
      if (user) {
        const payload = { id: user._id.toString() };
        const refresh = jsonwebtoken.sign(payload, appConfig.jwtSecret, {
          expiresIn: "1d",
          algorithm: "HS512",
        });
        return res.status(HttpStatus.OK).json({ token: refresh });
      } else {
        return res
          .status(HttpStatus.UN_AUTHORIZED)
          .json({ message: "UnAuthorized" });
      }
    }
    logger.error({
      url: req.originalUrl,
      method: req.method,
      body: req.body,
      stack: err.stack,
    });
    return res
      .status(HttpStatus.REQUEST_ERROR)
      .json({ error: `Error occurred : ${err}` });
  }
});

// Google authenticaiton
route.get("/google-auth", async (req, res) => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1] || "";
    if (!token)
      return res
        .status(HttpStatus.ERROR)
        .json({ message: "no id token found" });
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: appConfig.googleClientId,
    });
    const { name, email, sub } = ticket.getPayload();
    const foundUser = await common.findUserByEmail(email);
    if (foundUser.length) {
      const payload = {
        id: foundUser[0]._id.toString(),
      };
      const jwtToken = await jsonwebtoken.sign(payload, appConfig.jwtSecret, {
        expiresIn: "1d",
        algorithm: "HS512",
      });
      return res.status(HttpStatus.OK).json({ token: jwtToken });
    }
    const resp = await UserModel.insertOne({
      name,
      email,
      sub_id: sub,
      auth_type: AuthType.google_login,
    });
    const payload = {
      id: resp._id.toString(),
    };
    const jwtToken = await jsonwebtoken.sign(payload, appConfig.jwtSecret, {
      expiresIn: "1d",
      algorithm: "HS512",
    });
    return res.status(HttpStatus.OK).json({ token: jwtToken });
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
