import os from "os";
import crypto from "crypto";
import pLimit from "p-limit";
import { appConfig } from "../config/app.config.js";
import { transport } from "../config/smtp.config.js";

const cores = os.cpus.length;

export async function promiseCaller(arrs) {
  const limit = pLimit(cores);
  let arr = arrs.map((item) => limit(() => item));
  const resp = await Promise.all(arr);
  return resp;
}

export async function sendOtpEmail({ email, otp }) {
  try {
    const payload = {
      from: appConfig.smtpFrom,
      to: email,
      subject: "Authentication OTP",
      text: `Here's your otp : ${otp}`,
    };
    await transport.sendMail(payload);
  } catch (err) {
    throw err;
  }
}

export function genUuid() {
  const uuidGen = crypto.randomUUID();
  return uuidGen;
}

export function genOtpToken(){
  // Add some code to generate otp token
}