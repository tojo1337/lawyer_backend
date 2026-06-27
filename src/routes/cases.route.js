import mongoose from "mongoose";
import { Router } from "express";
import { logger } from "../config/pino.config.js";
import { HttpStatus } from "../enum/http-status.js";
import { CaseModel } from "../model/case.model.js";
import jwtMiddleware from "../middleware/jwt.middleware.js";
import * as caseSchema from "../schema/cases.schema.js";

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
      return {
        caseId,
        registrationDate: date_of_registration.toISOString(),
        courtName: court_name.toString(),
        litigant,
        litigantContact: litigant_contact,
        particulars: case_particulars.toString(),
        year,
        currentStage: current_stage.toString(),
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
