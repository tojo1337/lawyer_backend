import mongoose from "mongoose";
import { ModelName } from "../enum/model-name.js";
import { AuthType } from "../enum/auth-type.js";

const Plans = new mongoose.Schema(
  {
    plan_name: {
      type: String,
      required: true,
    },
    plan_id: {
      type: String,
      required: true,
    },
    chats_per_day: {
      type: Number,
      required: true,
    },
    plan_cost: {
      type: Number,
      required: true,
    },
  },
  {
    versionKey: false,
    collection: ModelName.PlansModel,
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
);

const PlansModel = mongoose.model(ModelName.PlansModel, Plans);

export { PlansModel };
