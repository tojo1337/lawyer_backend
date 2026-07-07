import mongoose from "mongoose";
import { ModelName } from "../enum/model-name.js";
import { AuthType } from "../enum/auth-type.js";

const FileSchema = new mongoose.Schema(
  {
    case_link: {
      type: mongoose.Types.ObjectId,
      ref: ModelName.CaseModel,
      required: true,
    },
    file_name: {
      type: String,
      required: true,
    },
    file_path: {
      type: String,
      required: true,
    },
    mime_type: {
      type: String,
      required: true,
    },
    file_size: {
      type: Number,
      required: true,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
    is_case_completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    versionKey: false,
    collection: ModelName.FileModel,
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
);

const FileModel = mongoose.model(ModelName.FileModel, FileSchema);

export { FileModel };
