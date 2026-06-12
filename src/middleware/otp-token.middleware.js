import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import * as helper from "../utils/helper.js";
import { UserModel } from "../model/user.model.js";
import { HttpStatus } from "../enum/http-status.js";
import { TokenModel } from "../model/token.model.js";
import { appConfig as common } from "../config/app.config.js";

export default async function otpTokeniddleware(req, res, next) {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1] || "";
    const decoded = jwt.verify(token, common.otpSecret);
    if (!decoded)
      return res
        .status(HttpStatus.UN_AUTHORIZED)
        .json({ message: "Invalid token" });
    const tokenData = await TokenModel.findOne({
      uuid: decoded.uuid,
    }).lean();
    if (!tokenData)
      return res.status(HttpStatus.ERROR).json({ message: "Invalid token" });
    const userData = await UserModel.findOne({
      _id: new mongoose.Types.ObjectId(tokenData.owner),
    }).lean();
    if (!userData)
      return res.status(HttpStatus.ERROR).json({ message: "Invalid Token" });
    req.userData = userData;
    return next();
  } catch (err) {
    return res
      .status(HttpStatus.UN_AUTHORIZED)
      .json({ message: "Invalid token" });
  }
}
