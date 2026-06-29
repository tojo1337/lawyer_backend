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
      const date = new Date();
      const startOfDate = date.setHours(0, 0, 0, 0);
      const endOfDate = date.setHours(23, 59, 59, 999);
      query["next_date"] = {
        $gte: startOfDate,
        $lte: endOfDate,
      };
    } else if (fromDate && !toDate) {
      query["next_date"] = {
        $gte: new Date(fromDate).setHours(0, 0, 0, 0),
      };
    } else if (!fromDate && toDate) {
      query["next_date"] = {
        $lte: new Date(toDate).setHours(23, 59, 59, 999),
      };
    } else if (fromDate && toDate) {
      query["next_date"] = {
        $gte: new Date(fromDate).setHours(0, 0, 0, 0),
        $lte: new Date(toDate).setHours(23, 59, 59, 999),
      };
    }

    let [courtNames, particulars, currentStages] = await helper.promiseCaller([
      CourtNameModel.find({}).lean(),
      ParticularsModel.find({}).lean(),
      CurrentStageModel.find({}).lean(),
    ]);

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
      const [courtNameRes] = courtNames.filter(
        (item) => item._id === courtNameVal,
      );
      const [currentStageValRes] = currentStages.filter(
        (item) => item._id === currentStageVal,
      );
      const [caseParticularsRes] = particulars.filter(
        (item) => item._id === caseParticularsVal,
      );

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
      _id: new mongoose.Types.ObjectId(caseId),
    }).lean();
    const caseIdVal = foundData._id.toString();
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
      caseNumber: case_number,
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
    const { caseId, skip = "0", limit = "10" } = req.query || {};
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

route.get("/search-case-entry", async (req, res) => {
  try {
    const { id } = req.userData || {};
    const { search = "" } = req.query || {};
    if (!id)
      return res.status(HttpStatus.ERROR).json({ message: "Unauthorized" });
    if (!search)
      return res
        .status(HttpStatus.OK)
        .json({ message: "Nothing to search in here", data: [] });
    const payload = search.toLowerCase();
    const searcItem = await CaseModel.find({
      case_owner: new mongoose.Types.ObjectId(id),
      $or: [
        { case_owner: { $regex: payload, $options: "i" } },
        { litigant: { $regex: payload, $options: "i" } },
        { litigant_contact: { $regex: payload, $options: "i" } },
        { year: { $regex: payload, $options: "i" } },
      ],
    })
      .lean()
      .map((item) => {
        return {
          caseId: item?._id.toString() || "",
          caseNumber: item?.case_number || "",
          registrationDate: item?.date_of_registration || "",
          courtName: item?.court_name || "",
          litigant: item?.litigant || "",
          litigantContact: item?.litigant_contact || "",
          particulars: item?.particulars || "",
          year: item?.year || "",
          currentStage: item?.current_stage || "",
          previousDate: item?.previous_date || "",
          nextDate: item?.next_date || "",
        };
      });
    return res
      .status(HttpStatus.OK)
      .json({ message: "Search performed successfully", data: searcItem });
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

route.get("/missing-advance-date-cases", async (req, res)=>{
  try{
    const { id } = req.userData || {};
    const { skip = "0", limit = "10" } = req.query || {};
    if (!id)
      return res
        .status(HttpStatus.ERROR)
        .json({ message: "Not authorized to perform the action" });
    const curentDate = new Date().setHours(0, 0, 0, 0);
    const skipVal = Number.isInteger(Number(skip)) ? Number(skip) : 0;
    const limitVal = Number.isInteger(Number(limit)) ? Number(lmit) : 10;
    const allCaseInfo = (
      (await CaseModel.find({
        case_owner: new mongoose.Types.ObjectId(id),
        next_date: { $lt: currentDate },
      })
        .skip(skipVal)
        .limit(limitVal)
        .lean()) || []
    ).map((item) => {
      return {
        caseId: item?._id.toString() || "",
        caseNumber: item?.case_number || "",
        registrationDate: item?.date_of_registration || "",
        courtName: item?.court_name || "",
        litigant: item?.litigant || "",
        litigantContact: item?.litigant_contact || "",
        particulars: item?.particulars || "",
        year: item?.year || "",
        currentStage: item?.current_stage || "",
        previousDate: item?.previous_date || "",
        nextDate: item?.next_date || "",
      };
    });
    return res
      .status(HttpStatus.OK)
      .json({ message: "Data fetched succhessfully", data: allCaseInfo || [] });
  }catch(err){
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
})

export { route };
