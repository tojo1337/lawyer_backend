import { Router } from "express";
import { HttpStatus } from "../enum/http-status.js";

const route = Router();

route.post("/email-auth-login", async (req, res) => {
  try {
    const { email, password } = req.body;
    return res
      .status(HttpStatus.OK)
      .json({ token: "", message: "Data is flowing in" });
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

route.get("/email-auth-refresh", async (req, res) => {
  try {
    // Add something in here
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

export { route };
