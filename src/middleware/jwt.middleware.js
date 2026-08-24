import crypto from "crypto";
import mongoose from "mongoose";
import { JwksClient } from "jwks-rsa";
import jwt, { decode } from "jsonwebtoken";
import { UserModel } from "../model/user.model.js";
import { appConfig } from "../config/app.config.js";
import { HttpStatus } from "../enum/http-status.js";
import { appConfig as common } from "../config/app.config.js";

// Client config
const client = new JwksClient({
  jwksUri: appConfig.jwksUri,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 600_000,
  timeout: 30_000,
});

// This will generate the key from authentik jwks
export function getKey(header, callback) {
  return client.getSigningKey(header.kid, function (err, key) {
    if (err) {
      return callback(err);
    }
    const publicKey = key.getPublicKey
      ? key.getPublicKey()
      : key.rsaPublicKey || key.publicKey;
    callback(null, publicKey);
  });
}

// Creating user in here
export async function createOTFUser(tokenObj) {
  try {
    let userUniqueId = "";
    const userSignature = `${tokenObj.iss}_${tokenObj.sub}`;
    const hashedUserId = crypto
      .createHash("md5")
      .update(userSignature)
      .digest("hex");
    const userObjPayload = {
      user_id: hashedUserId,
      name: tokenObj?.nickname,
      email: tokenObj?.email,
      is_active: true,
      is_online: false,
    };
    const existingUser = await UserModel.findOne({
      user_id: hashedUserId,
    }).lean();
    if (!existingUser) {
      const newUser = await UserModel.insertOne({ ...userObjPayload });
      userUniqueId = newUser._id.toString();
    } else if (existingUser) {
      userUniqueId = existingUser._id.toString();
    }
    return userUniqueId;
  } catch (err) {
    throw err;
  }
}

// Add the async decoder code in here
export async function deocdeToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey, { algorithms: ["RS256"] }, (err, decoded) => {
      if (err) {
        return reject(err);
      }
      return resolve(decoded);
    });
  });
}

// Check if it works
export default async function jwtMiddleware(req, res, next) {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1] || "";
    const decodedTokenObj = await deocdeToken(token);
    const userId = await createOTFUser(decodedTokenObj);
    const payload = {
      id: userId || "",
    };
    req.userData = payload;
    return next();
  } catch (err) {
    return res
      .status(HttpStatus.UN_AUTHORIZED)
      .json({ message: "Unauthorized" });
  }
}
