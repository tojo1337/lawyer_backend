import { Router } from "express";
import { logger } from "../config/pino.config.js";
import { HttpStatus } from "../enum/http-status.js";
import { jwtMiddleware } from "../middleware/jwt.middleware.js";

const routes = Router();
routes.use(jwtMiddleware)

routes.post("/crash-report", async (req, res) => {
  try {
    const data = req.body || "";
    logger.error({
      url: "app",
      body: data,
    });
    return res
      .status(HttpStatus.OK)
      .json({ message: "Crash has been recorded with success" });
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
});

export { routes };
