import mongoose from "mongoose";
import { ModelName } from "../enum/model-name.js";
import { activationTypes } from "../enum/activation-types.js";

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
      required: true,
    },
    end_date: {
      type: Date,
      required: true,
    },
    activation_status: {
      type: String,
      enum: [...Object.values(activationTypes)],
      default: activationTypes.pending,
    },
  },
  {
    versionKey: false,
    collection: ModelName.PlansMapperModel,
    timestamps: false,
  },
);

const PlansMapperModel = mongoose.model(ModelName.PlanMapper, PlanMapper);

export { PlansMapperModel };
