// Static collection in here
import mongoose from "mongoose";
import { ModelName } from "../enum/model-name.js";
import { AuthType } from "../enum/auth-type.js";

const ParticularsSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
  },
  {
    versionKey: false,
    collection: ModelName.Particulars,
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
);

const ParticularsModel = mongoose.model(
  ModelName.Particulars,
  ParticularsSchema,
);

export { ParticularsModel };
