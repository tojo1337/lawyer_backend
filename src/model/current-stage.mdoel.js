// Static collection over here
import mongoose from "mongoose";
import { ModelName } from "../enum/model-name.js";
import { AuthType } from "../enum/auth-type.js";

const CurrentStageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
  },
  {
    versionKey: false,
    collection: ModelName.CurrentStage,
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
);

const CurrentStageModel = mongoose.model(
  ModelName.CurrentStage,
  CurrentStageSchema,
);

export { CurrentStageModel };
