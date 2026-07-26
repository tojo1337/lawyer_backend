import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { UserModel } from "../model/user.model.js";
import { appConfig as common } from "../config/app.config.js";
import { logger } from "../config/pino.config.js";

export async function socketMiddleware(socket, next) {
  const secretKey = common.jwtSecret || "";
  try {
    // Initial setup to extract from header
    let authHeader = socket.handshake.headers.token || "";

    if (!authHeader) {
      return next(new Error("No token provided"));
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
      return next(new Error("No token provided"));
    }
    const decode = jwt.verify(token, secretKey);
    const user = await UserModel.findOne({
      uuid: decode.uuid,
      is_active: true,
    }).lean();
    if (!user) {
      return next(new Error("User not found"));
    }
    await UserModel.updateOne(
      {
        _id: new mongoose.Types.ObjectId(user._id.toString()),
      },
      { $set: { is_online: true, socket_id: socket.id } },
    );

    // Need to rethink abou this line
    socket.wsData = {
      id: user._id.toString(),
      uuid: user.uuid,
      role: user.role,
      socketId: socket.id,
    };
    return next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(new Error("Token expired"));
    } else {
      logger.error({
        url: socket.request.url,
        method: "Socket",
        body: "None",
        stack: err.stack,
      });
      return next(new Error("Failed the request"));
    }
  }
}
