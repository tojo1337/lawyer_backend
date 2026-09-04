import mongoose from "mongoose";
import { ModelName } from "../enum/model-name.js";

const PlanMapper = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Types.ObjectId,
      required: true,
    },
    subscription_id: {
      type: String,
      required: true,
    },
    plan_id: {
      type: String,
      required: true,
    },
    start_date: {
      type: Date,
    },
    end_date: {
      type: Date,
    },
  },
  {
    versionKey: false,
    collection: ModelName.PlansModel,
    timestamps: false,
  },
);

const PlansMapperModel = mongoose.model(ModelName.PlanMapper, PlanMapper);

export { PlansMapperModel };
