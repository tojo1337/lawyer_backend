import { HttpStatus } from "../enum/http-status.js";
import { passport } from "./passport.middleware.js";

// Jwt token middleware to retrun json response after passport validation
export default function jwtMiddleware(req, res, next) {
  return passport.authenticate("jwt", { session: false }, (err, user, info) => {
    if (err) {
      return res.status(HttpStatus.SERVER_ERROR).json({
        message: "Something went wrong",
      });
    }

    if (!user) {
      return res.status(HttpStatus.UN_AUTHORIZED).json({
        message: info?.message ?? "Unauthorized",
      });
    }

    req.user = user;
    next();
  })(req, res, next);
}
