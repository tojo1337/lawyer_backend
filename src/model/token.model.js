import mongoose, { modelNames } from "mongoose";
import { ModelName } from "../enum/model-name.js";

const TokenSchema = new mongoose.Schema(
  {
    owner: {
        type: mongoose.Types.ObjectId,
        ref: ModelName.UserModel,
        required: true
    },
    uuid: {
        type: String,
        required: true
    },
    otp: {
        type: String,
        required: true
    }
  },
  {
    versionKey: false,
    collection: ModelName.TokenModel,
    timestamps: {
      createdAt: "created_at",
      updatedAt: false,
    },
  },
);

const TokenModel = mongoose.model(ModelName.TokenModel, TokenSchema);

export { TokenModel };
