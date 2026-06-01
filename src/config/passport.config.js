// Add all the passport strategies in here
import { appConfig } from "./app.config.js";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";

// Jwt token authentication
export async function JwtConfig(passport, validatorFn) {
  const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: appConfig.jwtSecret,
  };
  passport.use(new JwtStrategy(opts, validatorFn));
}
