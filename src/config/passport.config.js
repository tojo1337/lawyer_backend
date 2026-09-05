import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import passport from "passport";
import { logger } from "./pino.config.js";
import { appConfig } from "./app.config.js";
import BearerStrategy from "passport-http-bearer";
import { UserModel } from "../model/user.model.js";
import GoogleStrategy from "passport-google-oauth20";
import FacebookStrategy from "passport-facebook";

// Passport bearer strategy
passport.use(
  new BearerStrategy(async (token, cb) => {
    try {
      const decryptVal = jwt.verify(token, appConfig.jwtSecret);
      const { id = "" } = decryptVal || {};
      if (!id) return cb(null, false);
      const userData = await UserModel.find({
        _id: new mongoose.Types.ObjectId(id),
      }).lean();
      if (!userData.length) return cb(null, false);
      cb(null, userData[0]);
    } catch (err) {
      logger.error({
        error: err.stack,
      });
      return cb(null, false);
    }
  }),
);

// Passport google auth strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: appConfig.googleClientId,
      clientSecret: appConfig.googleClientSecret,
      callbackURL: `${appConfig.baseUrl}/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, cb) => {
      try {
        const user = await UserModel.findOneAndUpdate(
          { user_id: profile.id },
          {
            $set: {
              email: profile.email,
              user_id: profile.id,
              name: profile.name,
            },
          },
          { new: true, upsert: true, setDefaultsOnInsert: true },
        );
        return cb(null, user);
      } catch (err) {
        logger.error({
          error: err.stack,
        });
        return done(null, false);
      }
    },
  ),
);

// Passport facebook auth strategy
passport.use(
  new FacebookStrategy(
    {
      clientID: appConfig.fbClientId,
      clientSecret: appConfig.fbClientSecret,
      callbackURL: `${appConfig.baseUrl}/auth/facebook/callback`,
      profileFields: ["id", "displayName", "email"],
    },
    async (accessToken, refreshToken, profile, cb) => {
      try {
        const user = await UserModel.findOneAndUpdate(
          { user_id: profile.id },
          {
            $set: {
              email: profile.email,
              user_id: profile.id,
              name: profile.displayName,
            },
          },
          { new: true, upsert: true, setDefaultsOnInsert: true },
        );
        return cb(null, user);
      } catch (err) {
        logger.error({
          error: err.stack,
        });
        return done(null, false);
      }
    },
  ),
);
