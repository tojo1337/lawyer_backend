import { Router } from "express";
import { HttpStatus } from "../enum/http-status.js";

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

export { route };
