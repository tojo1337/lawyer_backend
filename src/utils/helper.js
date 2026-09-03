import os from "os";
import crypto from "crypto";
import pLimit from "p-limit";
import mongoose from "mongoose";
import formidable from "formidable";
import { appConfig } from "../config/app.config.js";
import { transport } from "../config/smtp.config.js";
import { PlansMapperModel } from "../model/plan-mapper.model.js";
import { PlansModel } from "../model/plans.model.js";
import { PlansEnum } from "../enum/plans.js";
import { DateTime } from "luxon";

const cores = os.cpus().length;

export async function promiseCaller(arrs) {
  const limit = pLimit(cores);
  let arr = arrs.map((item) => limit(() => item()));
  const resp = await Promise.all(arr);
  return resp;
}

export async function sendOtpEmail({ email, otp }) {
  try {
    const payload = {
      from: appConfig.smtpSender,
      to: email,
      subject: "Authentication OTP",
      text: `Here's your otp : ${otp}`,
    };
    const _responseInfo = await transport.sendMail(payload);
  } catch (err) {
    throw err;
  }
}

export function genUuid() {
  const uuidGen = crypto.randomUUID();
  return uuidGen;
}

export function genOtpToken() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let otp = "";
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    otp += chars[randomIndex];
  }
  return otp;
}

export function createFormidable() {
  return formidable({
    maxFiles: 1,
    uploadDir: "static/",
    maxFileSize: 50 * 1024 * 1024,
  });
}

// Need to check if this is catching the paid tier or free tier
export async function getCurrentPlan(userId) {
  try {
    const currentDate = DateTime.now();
    let currentPlanId = null;
    let currentActivePlans = await PlansMapperModel.find({
      user_id: new mongoose.Types.ObjectId(userId ?? ""),
      start_date: { $lte: currentDate },
      end_date: { $gte: currentDate },
    }).lean();
    currentPlan = currentActivePlans[0].plan_id ?? '';
    if (!currentActivePlans.length) {
      const basicPlan = await PlansModel.findOne({
        plan_name: PlansEnum.basic,
      });
      const expirydate = currentDate.plus({ days: 30 });
      const responseData = await PlansMapperModel.insertOne({
        user_id: new mongoose.Types.ObjectId(userId),
        plan_id: basicPlan._id,
        start_date: currentDate.toJSDate(),
        end_date: expirydate.toJSDate(),
      });
      currentPlanId = responseData._id;
    }
    const mappedoutPlan = await PlansModel.find({
      _id: currentPlanId,
    });
    return mappedoutPlan;
  } catch (err) {
    throw err;
  }
}
