import mongoose from "mongoose";
import { ModelName } from "../enum/model-name.js";

const PlanMapper = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Types.ObjectId,
      required: true,
    },
    plan_obj_id: {
      type: mongoose.Types.ObjectId,
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
  },
  {
    versionKey: false,
    collection: ModelName.PlansModel,
    timestamps: false,
  },
);

const PlansMapperModel = mongoose.model(ModelName.PlanMapper, PlanMapper);

export { PlansMapperModel };
