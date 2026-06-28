import mongoose from "mongoose";
import { Router } from "express";
import { logger } from "../config/pino.config.js";
import { HttpStatus } from "../enum/http-status.js";
import { CaseModel } from "../model/case.model.js";
import jwtMiddleware from "../middleware/jwt.middleware.js";
import * as caseSchema from "../schema/cases.schema.js";
import * as helper from "../utils/helper.js";
import { CourtNameModel } from "../model/court-name.model.js";
import { CurrentStageModel } from "../model/current-stage.mdoel.js";
import { ParticularsModel } from "../model/particulars.model.js";

// Need to fix some code in here
const route = Router();

route.use(jwtMiddleware);

route.get("/get-all-cases", async (req, res) => {
  try {
    const { fromDate, toDate } = req.query || {};
    const { id } = req.userData || {};
    if (!id)
      return res
        .status(HttpStatus.UN_AUTHORIZED)
        .json({ message: "Unauthorized to perform this action" });

    // Query will be prepared in here
    await caseSchema.caseListing.validateAsync({ fromDate, toDate });
    const query = {};
    if (!fromDate && !toDate) {
      query["next_date"] = new Date();
    } else if (fromDate && !toDate) {
      query["next_date"] = {
        $gte: new Date(fromDate),
      };
    } else if (!fromDate && toDate) {
      query["next_date"] = {
        $lte: new Date(toDate),
      };
    } else if (fromDate && toDate) {
      query["next_date"] = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate),
      };
    }

    let [courtNames, particulars, currentStages] = await helper.promiseCaller(
      [
        CourtNameModel.find({}).lean(),
        ParticularsModel.find({}).lean(),
        CurrentStageModel.find({}).lean(),
      ],
    );

    courtNames = (courtNames || []).map((item) => {
      const _id = item._id.toString();
      return {
        _id,
        name: item.name || "",
      };
    });
    particulars = (particulars || []).map((item) => {
      const _id = item._id.toString();
      return {
        _id,
        name: item.name || "",
      };
    });
    currentStages = (currentStages || []).map((item) => {
      const _id = item._id.toString();
      return {
        _id,
        name: item.name || "",
      };
    });

    const allCaseList = (
      (await CaseModel.find({
        case_owner: new mongoose.Types.ObjectId(id),
        ...query,
      }).lean()) || []
    ).map((item) => {
      const caseId = item._id.toString();
      const {
        date_of_registration,
        court_name,
        case_number,
        litigant,
        litigant_contact,
        case_particulars,
        year,
        current_stage,
        previous_date,
        next_date,
      } = item || {};
      const courtNameVal = court_name.toString();
      const currentStageVal = current_stage.toString();
      const caseParticularsVal = case_particulars.toString();

      // Add some filtering code in here
      const [courtNameRes] = courtNames.filter(item=>item._id===courtNameVal);
      const [currentStageValRes] = currentStages.filter(item=>item._id===currentStageVal);
      const [caseParticularsRes] = particulars.filter(item=>item._id===caseParticularsVal);

      return {
        caseId,
        caseNumber: case_number,
        registrationDate: date_of_registration.toISOString(),
        courtName: courtNameRes.name || "",
        litigant,
        litigantContact: litigant_contact,
        particulars: caseParticularsRes.name || "",
        year,
        currentStage: currentStageValRes.name || "",
        previousDate: previous_date.toISOString(),
        nextDate: next_date.toISOString(),
      };
    });

    return res.status(HttpStatus.OK).json({ data: allCaseList || [] });
  } catch (err) {
    logger.error({
      url: req.originalUrl,
      method: req.method,
      body: req.body,
      stack: err.stack,
    });
    return res
      .status(HttpStatus.ERROR)
      .json({ message: "Something went wrong" });
  }
});

// Will be required for update as we will need something to prefill the form
route.get("/get-case-info/:caseId", async (req, res) => {
  try {
    const { id } = req.userData || {};
    const { caseId } = req.params || {};
    if (!caseId || !id)
      return res
        .status(HttpStatus.ERROR)
        .json({ message: "caseId or id not found" });

    await caseSchema.getCaseInfo.validateAsync({ caseId });
    const foundData = await CaseModel.findOne({
      case_owner: new mongoose.Types.ObjectId(id),
      _id: new mongoose.Types.ObjectId(id),
    }).lean();
    const caseIdVal = item._id.toString();
    const {
      date_of_registration,
      court_name,
      case_number,
      litigant,
      litigant_contact,
      case_particulars,
      year,
      current_stage,
      previous_date,
      next_date,
    } = foundData || {};
    const payload = {
      caseId: caseIdVal,
      registrationDate: date_of_registration,
      courtName: court_name,
      litigant,
      litigantContact: litigant_contact,
      particulars: case_particulars,
      year,
      currentStage: current_stage,
      previousDate: previous_date,
      nextDate: next_date,
    };
    return res
      .status(HttpStatus.OK)
      .json({ message: "Found case data", data: payload });
  } catch (err) {
    logger.error({
      url: req.originalUrl,
      method: req.method,
      body: req.body,
      stack: err.stack,
    });
    return res
      .status(HttpStatus.ERROR)
      .json({ message: "Something went wrong" });
  }
});

route.post("/make-or-edit-cases", async (req, res) => {
  try {
    const { id } = req.userData || {};
    const { caseId } = req.query || {};
    const {
      registrationDate,
      courtName,
      caseNumber,
      litigant,
      litigantContact,
      particulars,
      year,
      currentStage,
      previousDate,
      nextDate,
    } = req.body || {};
    if (!id)
      return res
        .status(HttpStatus.ERROR)
        .json({ message: "user id not found" });
    await caseSchema.upsertCaseSchema.validateAsync({
      registrationDate,
      courtName,
      caseNumber,
      litigant,
      litigantContact,
      particulars,
      year,
      currentStage,
      previousDate,
      nextDate,
    });
    const payload = {
      year,
      date_of_registration: registrationDate,
      court_name: courtName,
      case_number: caseNumber,
      litigant: litigant,
      litigant_contact: litigantContact,
      case_particulars: particulars,
      current_stage: currentStage,
      previous_date: previousDate,
      next_date: nextDate,
    };
    if (!caseId) {
      const _respData = await CaseModel.insertOne({
        case_owner: new mongoose.Types.ObjectId(id),
        ...payload,
      });
    } else {
      const _respDataUpdate = await CaseModel.updateOne(
        {
          _id: new mongoose.Types.ObjectId(caseId),
          case_owner: new mongoose.Types.ObjectId(id),
        },
        { $set: { ...payload } },
      );
    }
    return res
      .status(HttpStatus.OK)
      .json({ message: "Data saved successfully" });
  } catch (err) {
    logger.error({
      url: req.originalUrl,
      method: req.method,
      body: req.body,
      stack: err.stack,
    });
    return res
      .status(HttpStatus.ERROR)
      .json({ message: "Something went wrong" });
  }
});

route.get("/delete-case", async (req, res) => {
  try {
    const { caseId } = req.query || {};
    const { id } = req.userData || {};
    if (!caseId || !id)
      return res
        .status(HttpStatus.ERROR)
        .json({ message: "case Id or id not found" });
    await caseSchema.deleteCase.validateAsync({ caseId });
    const _deleteData = await CaseModel.deleteOne({
      case_owner: new mongoose.Types.ObjectId(id),
      _id: new mongoose.Types.ObjectId(caseId),
    });
    return res
      .status(HttpStatus.OK)
      .json({ message: "Case deleted with success" });
  } catch (err) {
    logger.error({
      url: req.originalUrl,
      method: req.method,
      body: req.body,
      stack: err.stack,
    });
    return res
      .status(HttpStatus.ERROR)
      .json({ message: "Something went wrong" });
  }
});

export { route };
