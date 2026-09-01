import mongoose from "mongoose";
import { ModelName } from "../enum/model-name.js";
import { AuthType } from "../enum/auth-type.js";

const ChatHistory = new mongoose.Schema(
  {
    chat_owner: {
      type: mongoose.Types.ObjectId,
      required: true,
    },
    chat_request: {
      type: String,
      required: true,
    },
    chat_response: {
      type: String,
      required: true,
    },
  },
  {
    versionKey: false,
    collection: ModelName.ChatHistory,
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
);

const ChatHistoryModel = mongoose.model(ModelName.ChatHistory, ChatHistory);

export { ChatHistoryModel };
