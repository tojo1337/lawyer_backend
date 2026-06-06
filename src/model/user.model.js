import mongoose from "mongoose";
import { ModelName } from "../enum/model-name.js";
import { AuthType } from "../enum/auth-type.js";

const UserSchema = new mongoose.Schema(
  {
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
    sub_id: {
      type: String,
    },
    auth_type: {
      type: String,
      enum: AuthType,
      default: AuthType.email_login,
    },
  },
  {
    versionKey: false,
    collection: "user",
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
);

const UserModel = mongoose.model(ModelName.UserModel, UserSchema);

export { UserModel };
