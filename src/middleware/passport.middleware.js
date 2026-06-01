import passport from "passport";
import * as common from "../utils/commons.js";
import { appConfig } from "../config/app.config.js";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";

// Jwt token authentication
const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: appConfig.jwtSecret,
};

// Passport strategy for jwt token authentication
passport.use(
  new JwtStrategy(opts, async (jwtPayload, done) => {
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

export { passport };
