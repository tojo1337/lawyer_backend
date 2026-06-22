import mongoose from "mongoose";
import { ModelName } from "../enum/model-name.js";
import { AuthType } from "../enum/auth-type.js";

const CaseSchema = new mongoose.Schema(
  {
    case_onwer: {
      type: mongoose.Types.ObjectId,
      ref: ModelName.UserModel,
      required: true,
    },
    date_of_registration: {
      type: Date,
      required: true,
    },
    court_name: {
      type: mongoose.Types.ObjectId,
      ref: ModelName.CourtName,
      required: true,
    },
    case_number: {
      type: String,
      required: true,
    },
    litigant: {
      type: String,
      required: true,
    },
    litigant_contact: {
      type: String,
      required: true,
    },
    case_particulars: {
      type: mongoose.Types.ObjectId,
      ref: ModelName.Particulars,
      required: true,
    },
    year: {
      type: String,
      required: true,
    },
    current_stage: {
      type: mongoose.Types.ObjectId,
      ref: ModelName.CurrentStage,
      required: true,
    },
    previous_date: {
      type: Date,
    },
    next_date: {
      type: Date,
    },
  },
  {
    versionKey: false,
    collection: ModelName.CaseModel,
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
);

const CaseModel = mongoose.model(ModelName.CaseModel, CaseSchema);

export { CaseModel };
