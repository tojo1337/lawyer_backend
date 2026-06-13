import mongoose from "mongoose";
import * as helper from "../utils/helper.js";
import * as common from "../utils/commons.js";
import { logger } from "../config/pino.config.js";
import { agenda } from "../config/agenda.config.js";
import { AgendaJobs } from "../enum/agenda-jobs.js";
import { TokenModel } from "../model/token.model.js";

// Generate otp and send to client
agenda.define(AgendaJobs.otpService, async (job) => {
  try {
    const { to: email, tokenId, otpToken } = job.attrs.data || {};
    if (!email || !tokenId || !otpToken)
      throw new Error(
        "Not all fields were provided among email, tokenId and otpToken",
      );
    const userData = await common.findUserByEmail(email);
    if (!userData.length)
      throw new Error(`No user found with the given email id : ${email}`);
    await helper.promiseCaller([
      helper.sendOtpEmail({ email, otp: otpToken }),
      TokenModel.updateOne(
        {
          _id: new mongoose.Types.ObjectId(tokenId),
        },
        {
          $set: {
            owner: userData[0]._id,
          },
        },
      ),
    ]);
  } catch (err) {
    logger.error({
      error: err.stack,
    });
  }
});
