import jwt from "jsonwebtoken";
import { UserModel } from "../model/user.model.js";
import { HttpStatus } from "../enum/http-status.js";
import { appConfig as common } from "../config/app.config.js";
import mongoose from "mongoose";

// Need to modify this one as well
export default async function jwtMiddleware(req, res, next) {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1] || "";
    const decoded = jwt.verify(token, common.jwtSecret);
    if (!decoded)
      return res
        .status(HttpStatus.UN_AUTHORIZED)
        .json({ message: "UnAuthorized" });
    const userAcc = await UserModel.findOne({
      _id: new mongoose.Types.ObjectId(decoded.id) || "",
    }).lean();
    if (!userAcc)
      return res
        .status(HttpStatus.UN_AUTHORIZED)
        .json({ message: "Unauthorized" });
    const payload = {
      id: decoded.id || ""
    };
    req.userData = payload;
    return next();
  } catch (err) {
    return res
      .status(HttpStatus.UN_AUTHORIZED)
      .json({ message: "Unauthorized" });
  }
}