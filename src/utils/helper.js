import os from "os";
import crypto from "crypto";
import pLimit from "p-limit";
import { appConfig } from "../config/app.config.js";
import { transport } from "../config/smtp.config.js";

const cores = os.cpus.length;

export function limiter(arrs) {
  const limit = pLimit(cores);
  let arr = arrs.map((item) => limit(() => item));
  return Promise.all(arr);
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
