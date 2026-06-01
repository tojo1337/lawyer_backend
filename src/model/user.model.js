import mongoose from "mongoose";
import { ModelName } from "../enum/model-name.js";

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
      required: true,
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
