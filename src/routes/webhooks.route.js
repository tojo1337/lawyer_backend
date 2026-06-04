import { Router } from "express";
import {passport} from "../config/passport.config.js";
import { logger } from "../config/pino.config.js";
import { HttpStatus } from "../enum/http-status.js";

const route = Router();

route.post(
  "/google-callback",
  passport.authenticate("google", { session: false }),
  async (req, res) => {
    try {
      console.log(req.user);
      return res
        .status(HttpStatus.OK)
        .json({ message: "Callback hit with success" });
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
  },
);

export { route };
