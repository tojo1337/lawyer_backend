import passport from "passport";
import * as common from "../utils/commons.js";
import { appConfig } from "./app.config.js";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { profile } from "console";

// Jwt token authentication
const jwtOpts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: appConfig.jwtSecret,
};

// Google options
const googleOpts = {
  clientID: appConfig.googleClientId,
  clientSecret: appConfig.googleClientSecret,
  callbackURL: `${appConfig.baseUrl}/webhooks/google-callback`,
};

// Passport strategy for jwt token authentication
passport.use(
  new JwtStrategy(jwtOpts, async (jwtPayload, done) => {
    try {
      const user = await common.findUserById(jwtPayload.id);
      if (user.length) {
        return done(null, user[0]);
      } else {
        return done(null, false);
      }
    } catch (err) {
      return done(err, false);
    }
  }),
);

passport.use(
  new GoogleStrategy(
    googleOpts,
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log(profile);
        done(null, profile);
      } catch (err) {
        throw err;
      }
    },
  ),
);

export { passport };
