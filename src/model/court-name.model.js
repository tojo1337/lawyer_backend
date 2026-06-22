// Static collection over here
import mongoose from "mongoose";
import { ModelName } from "../enum/model-name.js";
import { AuthType } from "../enum/auth-type.js";

const CourtNameSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
  },
  {
    versionKey: false,
    collection: ModelName.CourtName,
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
);

const CourtNameModel = mongoose.model(ModelName.CourtName, CourtNameSchema);

export { CourtNameModel };
