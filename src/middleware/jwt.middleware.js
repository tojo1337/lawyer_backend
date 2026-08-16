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

/**
 * On the fly user creation handler in here
 * This is teh decoded value from a token
{
  iss: "https://sso.devshell.online/application/o/test-auth/",
  sub: "522c485c5ab807c2595a7db9476e31c221789d844bc932275b311e68ee98c7c6",
  aud: "NqFyKrwbIOqSRYkW8zMEyeekdaVlQNGFj12ujQMi",
  exp: 1786886713,
  iat: 1786886413,
  auth_time: 1786886412,
  acr: "goauthentik.io/providers/oauth2/default",
  amr: [
    "pwd",
  ],
  nonce: "6Q_aAEO6ycp4Yqp1twtlUQ",
  sid: "7c19875a9a3f77d353eb8cbd7165f6938ba99c1a8bdbba7c521892d719cac4e2",
  jti: "eVhmxkaMgKH3Jpyci2I8vmARQxCpgAJKi1uFaJWh",
  email: "test@user.com",
  email_verified: false,
  name: "",
  given_name: "",
  preferred_username: "testuser",
  nickname: "testuser",
  groups: [
    "react-app",
  ],
  azp: "NqFyKrwbIOqSRYkW8zMEyeekdaVlQNGFj12ujQMi",
  uid: "ZLo1hXiCpTwZp5g5bEvziCDb1uWoAeUTm23VNfDQ",
  scope: "profile email openid",
}
 */
export async function createOTFUser(tokenObj) {
  try {
    const handler = {
      get(target, prop, receiver) {
        if (prop === "user_id") {
          return `${tokenObj.iss}_${tokenObj.sub}`;
        }
        if (prop === "name") {
          return tokenObj.name;
        }
        if (prop === "email") {
          return tokenObj.email;
        }
        if (prop === "is_active") {
          return true;
        }
        if (prop === "is_online") {
          return false;
        }
        if (prop === "socket_id") {
          return "";
        }
        return Reflect.get(...arguments);
      },
    };
    let userUniqueId = "";
    const proxiedUserObj = new Proxy({}, handler);
    const existingUser = await UserModel.findOne({
      user_id: proxiedUserObj.user_id,
    }).lean();
    if (!existingUser) {
      const newUser = await UserModel.insertOne({ ...proxiedUserObj });
      userUniqueId = newUser._id.toString();
    }
    userUniqueId = existingUser._id.toString();
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
    // Check if works then proceed
    // const userId = await createOTFUser(decodedTokenObj);
    // const payload = {
    //   id: decoded.id || ""
    // };
    // req.userData = payload;
    // return next();
  } catch (err) {
    return res
      .status(HttpStatus.UN_AUTHORIZED)
      .json({ message: "Unauthorized" });
  }
}
