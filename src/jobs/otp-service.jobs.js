import * as helper from "../utils/helper.js";
import * as common from "../utils/commons.js";
import { logger } from "../config/pino.config.js";
import { agenda } from "../config/agenda.config.js";
import { AgendaJobs } from "../enum/agenda-jobs.js";
import { TokenModel } from "../model/token.model.js";

// Generate otp and send to client
agenda.define(AgendaJobs.otpService, async (job) => {
  try {
    const { email } = job.attr.data;
    const otpId = helper.genUuid();
    const otpToken = helper.genOtpToken();
    const userData = await common.findUserByEmail(email);
    if (!userData)
      throw new Error(`No user found with the given email id : ${email}`);
    // This thing sends the otp
    await helper.promiseCaller([
      helper.sendOtpEmail({ email, otp: otpToken }),
      TokenModel.insertOne({
        owner: userData._id,
        uuid: otpId,
        otp: otpToken,
      }),
    ]);
  } catch (err) {
    logger.error({
      error: err.stack,
    });
  }
});
