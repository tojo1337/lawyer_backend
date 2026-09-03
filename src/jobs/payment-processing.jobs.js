import { agenda } from "../config/agenda.config.js";
import { logger } from "../config/pino.config.js";
import { AgendaJobs } from "../enum/agenda-jobs.js";
import { PlansModel } from "../model/plans.model.js";

agenda.define(AgendaJobs.paymentProcessing, async (job) => {
  try {
    const { event, payload } = job.attr.data || {};
    if (!event || !payload) throw new Error("Event or Payload missing");

    // Add some code in respect to the events in here
    // Only add plan for activated, remove plan for rest
    // Remove plan by default as these are the only things which are important
    if (event === "subscription.activated") {
      const planId = payload?.subscription?.entity || "";
      if (!planId) throw new Error("No plan id on response body");
      const planData = await PlansModel.find({ plan_id: planId }).lean();
    } else if (event === "subscription.updated") {
      const planId = payload?.subscription?.entity || "";
      if (!planId) throw new Error("No plan id on response body");
    } else if (event === "subscription.pending") {
      const planId = payload?.subscription?.entity || "";
      if (!planId) throw new Error("No plan id on response body");
    } else if (event === "subscription.halted") {
      const planId = payload?.subscription?.entity || "";
      if (!planId) throw new Error("No plan id on response body");
    } else if (event === "subscription.paused") {
      const planId = payload?.subscription?.entity || "";
      if (!planId) throw new Error("No plan id on response body");
    } else if (event === "subscription.resumed") {
      const planId = payload?.subscription?.entity || "";
      if (!planId) throw new Error("No plan id on response body");
    } else if (event === "subscription.cancelled") {
      const planId = payload?.subscription?.entity || "";
      if (!planId) throw new Error("No plan id on response body");
    } else {
      const planId = payload?.subscription?.entity || "";
      if (!planId) throw new Error("No plan id on response body");
    }
  } catch (err) {
    logger.error({
      error: err.stack,
    });
  }
});
