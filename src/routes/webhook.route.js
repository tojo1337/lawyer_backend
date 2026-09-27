import { Router } from "express";
import { validateWebhookSignature } from "razorpay/dist/utils/razorpay-utils";
import { appConfig } from "../config/app.config.js";
import { agenda } from "../config/agenda.config.js";
import { HttpStatus } from "../enum/http-status.js";
import { logger } from "../config/pino.config.js";

const route = Router();

route.post("/razorpay-webhook", async (req, res) => {
  try {
    const reqBody = req.body;
    const webhookSign = req.header["x-razorpay-signature"] || "";
    const validateResponse = validateWebhookSignature(
      JSON.stringify(reqBody),
      webhookSign,
      appConfig.razorpaySecrets,
    );
    if (validateResponse) {
      const { event, payload } = reqBody || {};
      await agenda.now(AgendaJobs.paymentProcessing, { event, payload });
      return res
        .status(HttpStatus.OK)
        .json({ message: "Processed with success" });
    } else {
      return res
        .status(HttpStatus.ERROR)
        .json({ message: "Invalid signature" });
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
