import mongoose from "mongoose";
import { ModelName } from "../enum/model-name.js";
import { AuthType } from "../enum/auth-type.js";

const UserSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    is_online: {
      type: Boolean,
      default: false,
    },
  },
  {
    versionKey: false,
    collection: ModelName.UserModel,
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
);

const UserModel = mongoose.model(ModelName.UserModel, UserSchema);

export { UserModel };
