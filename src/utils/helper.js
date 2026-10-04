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
import { PassThrough } from "stream";
import { Upload } from "@aws-sdk/lib-storage";
import { storageClient } from "../config/s3-client.config.js";
import { activationTypes } from "../enum/activation-types.js";

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

export function fileUploadStreamHandler(file) {
  const passStream = new PassThrough();
  const s3FileKey = `uploads/${file.newFilename}`;
  const uploadToS3 = new Upload({
    client: storageClient,
    params: {
      Bucket: appConfig.bucketName,
      Key: s3FileKey,
      Body: passStream,
    },
    queueSize: 4,
    partSize: 5 * 1024 * 1024,
  });
  uploadToS3.done().catch((err) => {
    logger.error({
      message: "S3 upload failed",
      key: s3FileKey,
      stack: err.stack,
    });
  });
  return passStream;
}

export function createFormidable() {
  return formidable({
    maxFiles: 1,
    // uploadDir: "static/",
    maxFileSize: 50 * 1024 * 1024,
    fileWriteStreamHandler: fileUploadStreamHandler,
  });
}

// There is an issue in here while assiging plan
// Need to check if this is catching the paid tier or free tier
export async function getCurrentPlan(userId) {
  try {
    const currentDate = DateTime.now();
    let currentPlanId = null;
    let currentActivePlans = await PlansMapperModel.find({
      user_id: new mongoose.Types.ObjectId(userId ?? ""),
      start_date: { $lte: currentDate },
      end_date: { $gte: currentDate },
      activation_status: activationTypes.active,
    })
      .sort({ start_date: -1 })
      .lean();
    if (!currentActivePlans.length) {
      const basicPlan = await PlansModel.findOne({
        plan_name: PlansEnum.basic,
      }).lean();
      const expirydate = currentDate.plus({ days: 30 });
      const responseData = await PlansMapperModel.insertOne({
        user_id: new mongoose.Types.ObjectId(userId),
        plan_id: basicPlan.plan_id,
        subscription_id: genUuid(),
        start_date: currentDate.toJSDate(),
        end_date: expirydate.toJSDate(),
        activation_status: activationTypes.active,
      });
      currentPlanId = responseData?.plan_id || null;
    } else {
      currentPlanId = currentActivePlans[0]?.plan_id || null;
    }
    const mappedoutPlan = await PlansModel.findOne({
      plan_id: currentPlanId,
    }).lean();
    return mappedoutPlan;
  } catch (err) {
    throw err;
  }
}

export function randomIdGen() {
  return crypto.randomUUID();
}
