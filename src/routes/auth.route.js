import bcrypt from "bcrypt";
import { Router } from "express";
import { logger } from "../config/pino.config.js";
import { HttpStatus } from "../enum/http-status.js";
import * as common from "../utils/commons.js";
import * as helper from "../utils/helper.js";
import { UserModel } from "../model/user.model.js";

const route = Router();
const bcryptRounds = 5;

route.post("/email-auth-register", async (req, res)=>{
  try{
    const { name, email, password } = req.body;
    if (name === "" || email === "" || password === "")
      return res
        .status(HttpStatus.ERROR)
        .json({ message: "Not all fields were provided" });
    const userEtnry = await common.findUserFromEmail(email);
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
  }catch(err){
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

route.post("/email-auth-login", async (req, res) => {
  try {
    const { email, password } = req.body;
    return res
      .status(HttpStatus.OK)
      .json({ token: "", message: "Data is flowing in" });
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
