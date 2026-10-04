import { response, Router } from "express";
import { logger } from "../config/pino.config.js";
import { HttpStatus } from "../enum/http-status.js";
import { gateway } from "../config/razorpay.config.js";
import { PlansModel } from "../model/plans.model.js";
import { appConfig } from "../config/app.config.js";
import { PlansMapperModel } from "../model/plan-mapper.model.js";
import { jwtMiddleware } from "../middleware/jwt.middleware.js";
import * as helper from "../utils/helper.js";
import mongoose from "mongoose";
import { UserModel } from "../model/user.model.js";
import { DateTime } from "luxon";
import { activationTypes } from "../enum/activation-types.js";

const route = Router();
const paymentGateway = gateway;

route.use(jwtMiddleware);

route.get("/get-all-plans", async (req, res) => {
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

route.get("/get-active-plan", async (req, res) => {
  try {
    const { id = "" } = req.userData || {};
    const [mapped_plan, all_plan_data] = await helper.promiseCaller([
      () =>
        PlansMapperModel.findOne({
          user_id: new mongoose.Types.ObjectId(id),
          activation_status: activationTypes.active,
        })
          .sort({ start_date: -1 })
          .lean(),
      () => PlansModel.find({}).lean(),
    ]);
    if (!mapped_plan) {
      const basic_plan = (all_plan_data || []).filter(
        (item) => item.plan_name === "Basic",
      )[0];
      const startDate = DateTime.now();
      const endDate = startDate.plus({ days: 30 });
      const _resp = await PlansMapperModel.findOneAndUpdate(
        { user_id: new mongoose.Types.ObjectId(id) },
        {
          $set: {
            subscription_id: helper.genUuid(),
            user_id: new mongoose.Types.ObjectId(id),
            plan_id: new mongoose.Types.ObjectId(basic_plan._id),
            start_date: startDate.toJSDate(),
            end_date: endDate.toJSDate(),
            activation_status: activationTypes.active,
          },
        },
        {
          upsert: true,
          returnDocument: "after",
          sort: { start_date: -1 },
        },
      );
      basic_plan.start_date = startDate;
      basic_plan.end_date = endDate;
      return res.status(HttpStatus.OK).json({ data: basic_plan });
    }
    let response_plan = all_plan_data.reduce((acc, item) => {
      if (item.plan_id.toString() === mapped_plan.plan_id.toString()) {
        item.start_date = mapped_plan.start_date;
        item.end_date = mapped_plan.end_date;
        acc = item;
      }
      return acc;
    }, null);
    return res.status(HttpStatus.OK).send({ data: response_plan });
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

route.get("/create-checkout-session", async (req, res) => {
  try {
    const { id } = req.userData || {};
    const { plan_id = "" } = req.query || {};
    if (!id)
      return res
        .status(HttpStatus.ERROR)
        .json({ message: "User not authorized.1" });
    if (!plan_id)
      return res
        .status(HttpStatus.ERROR)
        .json({ message: "Plan id is required" });
    const [planData, userData] = await helper.promiseCaller([
      () =>
        PlansModel.find({
          _id: new mongoose.Types.ObjectId(plan_id),
        }).lean(),
      () => UserModel.findById(id).lean(),
    ]);
    if (!planData.length)
      return res
        .status(HttpStatus.ERROR)
        .json({ message: "Plan doesn't exist" });
    const checkoutPayload = {
      plan_id: planData[0]?.plan_id || "",
      total_count: Number.isInteger(Number(appConfig.totalProductCount))
        ? Number(appConfig.totalProductCount)
        : 12,
      quantity: Number.isInteger(Number(appConfig.productQuantityPerMonth))
        ? Number(appConfig.productQuantityPerMonth)
        : 1,
      customer_notify: appConfig.customerNotifire === "true" ? true : false,
    };
    const order =
      (await paymentGateway.subscriptions.create(checkoutPayload)) || {};
    const startingDate = DateTime.now().toJSDate();
    const endingDate = DateTime.now().plus({ days: 30 }).toJSDate();
    await PlansMapperModel.insertOne({
      user_id: id,
      subscription_id: order.id,
      plan_id: order.plan_id,
      start_date: startingDate,
      end_date: endingDate,
    });
    return res.status(HttpStatus.OK).json({
      ...order,
      subscription_id: order.id,
      key: appConfig.razorpayId,
      prefill: {
        email: userData?.email || "",
        name: userData?.name || "",
        contact: userData?.contact || "",
      },
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
