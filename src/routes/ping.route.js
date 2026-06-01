import { Router } from "express";
import { logger } from "../config/pino.config.js";
import { HttpStatus } from "../enum/http-status.js";
import jwtMiddleware from "../middleware/jwt.middleware.js";

const route = Router();

route.get("/ping", async (req, res) => {
  try {
    return res.status(HttpStatus.OK).json({ message: "pong" });
  } catch (err) {
    logger.error({
      url: req.originalUrl,
      method: req.method,
      body: req.body,
      stack: err.stack,
    });
    return res
      .status(HttpStatus.ERROR)
      .json({ message: "Some errror occurred" });
  }
});

// Check if the middleware is working properly
route.get("/secure-ping",jwtMiddleware ,async (req, res) => {
  try {
    return res.status(HttpStatus.OK).json({ message: "pong" });
  } catch (err) {
    logger.error({
      url: req.originalUrl,
      method: req.method,
      body: req.body,
      stack: err.stack,
    });
    return res
      .status(HttpStatus.ERROR)
      .json({ message: "Some errror occurred" });
  }
});

export { route };
