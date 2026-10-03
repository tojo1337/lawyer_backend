import { DateTime } from "luxon";
import * as helper from "../utils/helper.js";
import { logger } from "../config/pino.config.js";
import { agenda } from "../config/agenda.config.js";
import { AgendaJobs } from "../enum/agenda-jobs.js";
import { PlansModel } from "../model/plans.model.js";
import { PlansMapperModel } from "../model/plan-mapper.model.js";
import { activationTypes } from "../enum/activation-types.js";

const knownEventTypes = [
  "subscription.activated",
  "subscription.updated",
  "subscription.pending",
  "subscription.halted",
  "subscription.paused",
  "subscription.resumed",
  "subscription.cancelled",
];

const paymentLookup = {
  "subscription.activated": planActivation,
  "subscription.updated": removeActivePlan,
  "subscription.pending": removeActivePlan,
  "subscription.halted": removeActivePlan,
  "subscription.paused": removeActivePlan,
  "subscription.resumed": removeActivePlan,
  "subscription.cancelled": removeActivePlan,
};

agenda.define(AgendaJobs.paymentProcessing, async (job) => {
  try {
    const { event, payload } = job.attrs.data || {};
    if (!event || !payload) throw new Error("Event or Payload missing");
    if (knownEventTypes.includes(event)) {
      await paymentLookup[event](payload);
    }
  } catch (err) {
    logger.error({
      error: err.stack,
    });
  }
});

async function removeActivePlan(payload) {
  try {
    const { plan_id: planId = "", id: subId = "" } =
      payload?.subscription?.entity || {};
    if (!planId || !subId)
      throw new Error("No plan_id or sub_id on response body");
    const [mappedPlan, planEntity] = await helper.promiseCaller([
      () => PlansMapperModel.find({ subscription_id: subId }).lean(),
      () => PlansModel.find({ plan_id: planId }).lean(),
    ]);
    if (!mappedPlan.length || !planEntity.length)
      throw new Error("No mapped plan or plan entity on db");
    if (mappedPlan[0].plan_id === planEntity[0].plan_id) {
      const now = DateTime.now();
      await PlansMapperModel.updateOne(
        { _id: mappedPlan[0]._id },
        { $set: { activation_status: activationTypes.deactivate } },
      );
    }
  } catch (err) {
    throw err;
  }
}

async function planActivation(payload) {
  try {
    const { plan_id: planId = "", id: subId = "" } =
      payload?.subscription?.entity || {};
    if (!planId || !subId)
      throw new Error("No plan_id or sub_id on response body");
    const [mappedPlan, planEntity] = await helper.promiseCaller([
      () => PlansMapperModel.find({ subscription_id: subId }).lean(),
      () => PlansModel.find({ plan_id: planId }).lean(),
    ]);
    if (!mappedPlan.length || !planEntity.length)
      throw new Error("No mapped plan or plan entity on db");
    if (mappedPlan[0].plan_id === planEntity[0].plan_id) {
      const now = DateTime.now();
      await PlansMapperModel.updateOne(
        { _id: mappedPlan[0]._id },
        {
          $set: {
            start_date: now.toJSDate(),
            end_date: now.plus({ days: 30 }).toJSDate(),
            activation_status: activationTypes.active,
          },
        },
      );
    }
  } catch (err) {
    throw err;
  }
}

async function planUpdate(payload) {
  try {
    const { plan_id: planId = "", id: subId = "" } =
      payload?.subscription?.entity || {};
  } catch (err) {
    throw err;
  }
}
