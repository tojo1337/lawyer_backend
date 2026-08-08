import mongoose from "mongoose";
import { ModelName } from "../enum/model-name.js";
import { AuthType } from "../enum/auth-type.js";

const VectorTrackerSchema = new mongoose.Schema(
  {
    embedding_id: {
      type: String,
      required: true,
    },
    case_id: {
      type: mongoose.Types.ObjectId,
      required: true,
    },
    owner_id: {
      type: mongoose.Types.ObjectId,
      required: true,
    },
  },
  {
    versionKey: false,
    collection: ModelName.VectorTracker,
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
);

const VectorTrackerModel = mongoose.model(
  ModelName.VectorTracker,
  VectorTrackerSchema,
);

export { VectorTrackerModel };
