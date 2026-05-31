import mongoose from "mongoose";
import { appConfig } from "../config/app.config.js";

export default async function dbConnector() {
  try {
    await mongoose.connect(appConfig.appDb);
  } catch (err) {
    throw err;
  }
}
