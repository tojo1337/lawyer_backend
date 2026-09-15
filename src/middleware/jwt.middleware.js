import jwt from "jsonwebtoken";
import passport from "passport";
import { logger } from "../config/pino.config.js";
import { UserModel } from "../model/user.model.js";
import { appConfig } from "../config/app.config.js";
import { HttpStatus } from "../enum/http-status.js";
import mongoose from "mongoose";

export function jwtMiddleware(req, res, next) {
  passport.authenticate("bearer", { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: info?.message ?? "Unauthorized",
      });
    }

    req.userData = {
      id: user._id.toString(),
      email: user.email
    };
    next();
  })(req, res, next);
}

export async function refreshMiddleware(req, res, next) {
  try {
    const secret = appConfig.jwtSecret ?? "";
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer")) {
      const token = authHeader.split(" ")[1] ?? "";
      const decodedValue = jwt.verify(token, secret, {
        ignoreExpiration: true,
      });
      const { id } = decodedValue;
      const userData = await UserModel.find({
        _id: new mongoose.Types.ObjectId(id),
      });
      if (userData.length) {
        req.userData = {
          id: userData[0]._id.toString(),
          email: userData[0].email,
        };
        return next();
      } else {
        return res
          .status(HttpStatus.UN_AUTHORIZED)
          .json({ message: "Invalid token" });
      }
    } else {
      return res
        .status(HttpStatus.UN_AUTHORIZED)
        .json({ message: "Invalid token" });
    }
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
}
