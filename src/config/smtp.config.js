import nodemailer from "nodemailer";
import { appConfig } from "./app.config.js";

export const transport = nodemailer.createTransport({
  host: appConfig.smtpHost,
  port: appConfig.smtpPort,
  secure: true,
  auth: {
    user: appConfig.smtpUser,
    pass: appConfig.smtpPass,
  },
});
