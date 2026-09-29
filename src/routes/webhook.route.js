import { Router } from "express";
import { logger } from "../config/pino.config.js";
import { appConfig } from "../config/app.config.js";
import { agenda } from "../config/agenda.config.js";
import { HttpStatus } from "../enum/http-status.js";
import { AgendaJobs } from "../enum/agenda-jobs.js";
import { validateWebhookSignature } from "razorpay/dist/utils/razorpay-utils.js";

const route = Router();

route.post("/razorpay-webhook", async (req, res) => {
  try {
    const reqBody = req.body;
    const webhookSign = req.header("X-Razorpay-Signature") || "";
    const validateResponse = validateWebhookSignature(
      JSON.stringify(reqBody),
      webhookSign,
      appConfig.webhookSecret,
    );
    if (validateResponse) {
      const { event, payload } = reqBody || {};
      await agenda.now(AgendaJobs.paymentProcessing, { event, payload });
      return res.status(HttpStatus.OK).json({ status: "ok" });
    } else {
      return res
        .status(HttpStatus.ERROR)
        .json({ status: "verification_failed" });
    }
  } catch (err) {
    logger.error({
      url: req.originalUrl,
      method: req.method,
      body: req.body,
      stack: err.stack,
    });
    return res
      .status(HttpStatus.SERVER_ERROR)
      .json({ message: "Some error occurred" });
  }
});

export { route };
