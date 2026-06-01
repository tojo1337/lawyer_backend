import mongoose from "mongoose";
import { ModelName } from "../enum/model-name.js";

const UserSchema = new mongoose.Schema(
  {
    uuid: {
      type: String,
      required: true,
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
      required: true,
    },
  },
  { versionKey: false, collection: "user" },
);

const UserModel = mongoose.model(ModelName.UserModel, UserSchema);

export { UserModel };
