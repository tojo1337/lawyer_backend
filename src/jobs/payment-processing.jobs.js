import { DateTime } from "luxon";
import * as helper from "../utils/helper.js";
import { logger } from "../config/pino.config.js";
import { agenda } from "../config/agenda.config.js";
import { AgendaJobs } from "../enum/agenda-jobs.js";
import { PlansModel } from "../model/plans.model.js";
import { PlansMapperModel } from "../model/plan-mapper.model.js";

agenda.define(AgendaJobs.paymentProcessing, async (job) => {
  try {
    const { event, payload } = job.attr.data || {};
    if (!event || !payload) throw new Error("Event or Payload missing");
    if (event === "subscription.activated") {
      const { plan_id: planId = "", id: subId = "" } =
        payload?.subscription?.entity || {};
      if (!planId || !subId)
        throw new Error("No plan_id or sub_id on response body");
      const [mappedPlan, planEntity] = await helper.promiseCaller([
        PlansMapperModel.find({ subscription_id: subId }).lean(),
        PlansModel.find({ plan_id: planId }).lean(),
      ]);
      if (mappedPlan[0].plan_id === planEntity[0].plan_id) {
        const now = DateTime.now();
        await PlansMapperModel.updateOne(
          { _id: mappedPlan[0]._id },
          {
            $set: {
              start_date: now.toJSDate(),
              end_date: now.plus({ days: 30 }).toJSDate(),
            },
          },
        );
      }
    } else if (event === "subscription.updated") {
      const { plan_id: planId = "", id: subId = "" } =
        payload?.subscription?.entity || {};
      if (!planId || !subId)
        throw new Error("No plan_id or sub_id on response body");
      const [mappedPlan, planEntity] = await helper.promiseCaller([
        PlansMapperModel.find({ subscription_id: subId }).lean(),
        PlansModel.find({ plan_id: planId }).lean(),
      ]);
      if (mappedPlan[0].plan_id === planEntity[0].plan_id) {
        const now = DateTime.now();
        await PlansMapperModel.deleteOne({ _id: mappedPlan[0]._id });
      }
    } else if (event === "subscription.pending") {
      const { plan_id: planId = "", id: subId = "" } =
        payload?.subscription?.entity || {};
      if (!planId || !subId)
        throw new Error("No plan_id or sub_id on response body");
      const [mappedPlan, planEntity] = await helper.promiseCaller([
        PlansMapperModel.find({ subscription_id: subId }).lean(),
        PlansModel.find({ plan_id: planId }).lean(),
      ]);
      if (mappedPlan[0].plan_id === planEntity[0].plan_id) {
        const now = DateTime.now();
        await PlansMapperModel.deleteOne({ _id: mappedPlan[0]._id });
      }
    } else if (event === "subscription.halted") {
      const { plan_id: planId = "", id: subId = "" } =
        payload?.subscription?.entity || {};
      if (!planId || !subId)
        throw new Error("No plan_id or sub_id on response body");
      const [mappedPlan, planEntity] = await helper.promiseCaller([
        PlansMapperModel.find({ subscription_id: subId }).lean(),
        PlansModel.find({ plan_id: planId }).lean(),
      ]);
      if (mappedPlan[0].plan_id === planEntity[0].plan_id) {
        const now = DateTime.now();
        await PlansMapperModel.deleteOne({ _id: mappedPlan[0]._id });
      }
    } else if (event === "subscription.paused") {
      const { plan_id: planId = "", id: subId = "" } =
        payload?.subscription?.entity || {};
      if (!planId || !subId)
        throw new Error("No plan_id or sub_id on response body");
      const [mappedPlan, planEntity] = await helper.promiseCaller([
        PlansMapperModel.find({ subscription_id: subId }).lean(),
        PlansModel.find({ plan_id: planId }).lean(),
      ]);
      if (mappedPlan[0].plan_id === planEntity[0].plan_id) {
        const now = DateTime.now();
        await PlansMapperModel.deleteOne({ _id: mappedPlan[0]._id });
      }
    } else if (event === "subscription.resumed") {
      const { plan_id: planId = "", id: subId = "" } =
        payload?.subscription?.entity || {};
      if (!planId || !subId)
        throw new Error("No plan_id or sub_id on response body");
      const [mappedPlan, planEntity] = await helper.promiseCaller([
        PlansMapperModel.find({ subscription_id: subId }).lean(),
        PlansModel.find({ plan_id: planId }).lean(),
      ]);
      if (mappedPlan[0].plan_id === planEntity[0].plan_id) {
        const now = DateTime.now();
        await PlansMapperModel.deleteOne({ _id: mappedPlan[0]._id });
      }
    } else if (event === "subscription.cancelled") {
      const { plan_id: planId = "", id: subId = "" } =
        payload?.subscription?.entity || {};
      if (!planId || !subId)
        throw new Error("No plan_id or sub_id on response body");
      const [mappedPlan, planEntity] = await helper.promiseCaller([
        PlansMapperModel.find({ subscription_id: subId }).lean(),
        PlansModel.find({ plan_id: planId }).lean(),
      ]);
      if (mappedPlan[0].plan_id === planEntity[0].plan_id) {
        const now = DateTime.now();
        await PlansMapperModel.deleteOne({ _id: mappedPlan[0]._id });
      }
    } else {
      const { plan_id: planId = "", id: subId = "" } =
        payload?.subscription?.entity || {};
      if (!planId || !subId)
        throw new Error("No plan_id or sub_id on response body");
      const [mappedPlan, planEntity] = await helper.promiseCaller([
        PlansMapperModel.find({ subscription_id: subId }).lean(),
        PlansModel.find({ plan_id: planId }).lean(),
      ]);
      if (mappedPlan[0].plan_id === planEntity[0].plan_id) {
        const now = DateTime.now();
        await PlansMapperModel.deleteOne({ _id: mappedPlan[0]._id });
      }
    }
  } catch (err) {
    logger.error({
      error: err.stack,
    });
  }
});
