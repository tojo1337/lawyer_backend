import { Router } from "express";
import { logger } from "../config/pino.config.js";
import { HttpStatus } from "../enum/http-status.js";
import { gateway } from "../config/razorpay.config.js";
import { PlansModel } from "../model/plans.model.js";
import { appConfig } from "../config/app.config.js";
import { agenda } from "../config/agenda.config.js";
import { AgendaJobs } from "../enum/agenda-jobs.js";
import { PlansMapperModel } from "../model/plan-mapper.model.js";
import { validateWebhookSignature } from "razorpay/dist/utils/razorpay-utils.js";

const route = Router();
const paymentGateway = gateway;

route.get("/get-all-produces", async (req, res) => {
  try {
    const productData = await PlansModel.find({}).lean();
    return res.status(HttpStatus.OK).json({ data: productData || [] });
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

route.post("/create-checkout-session", async (req, res) => {
  try {
    const { id } = req.userData || {};
    const { plan_id = "" } = req.body || {};
    if (!id)
      return res
        .status(HttpStatus.ERROR)
        .json({ message: "User not authorized.1" });
    if (!plan_id)
      return res
        .status(HttpStatus.ERROR)
        .json({ message: "Plan id is required" });
    const planData = await PlansModel.find({ plan_id }).lean();
    if (!planData.length)
      return res
        .status(HttpStatus.ERROR)
        .json({ message: "Plan doesn't exist" });
    const checkoutPayload = {
      plan_id,
      total_count: 12,
      quantity: 1,
      customer_notify: true,
    };
    const { id: sub_id = "", plan_id: planId = "" } =
      (await paymentGateway.subscription.create(checkoutPayload)) || {};
    await PlansMapperModel.insertOne({
      user_id: id,
      subscription_id: sub_id,
      plan_id: planId,
    });
    return res.status(HttpStatus.OK).json({
      subscription_id: subscription.id,
      key: appConfig.razorpayId,
    });
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
