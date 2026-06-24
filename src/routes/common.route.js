import { Router } from "express";
import { logger } from "../config/pino.config.js";
import { HttpStatus } from "../enum/http-status.js";
import { CourtNameModel } from "../model/court-name.model.js";
import { ParticularsModel } from "../model/particulars.model.js";
import { CurrentStageModel } from "../model/current-stage.mdoel.js";
import jwtMiddleware from "../middleware/jwt.middleware.js";

// Add the document adding logic in here
const route = Router();

route.use(jwtMiddleware);

route.get("/name-of-courts", async (req, res) => {
  try {
    const dataArr = (await CourtNameModel.find({}).lean()).map((item) => {
      const { _id, name } = item || {};
      return {
        id: _id.toString(),
        name,
      };
    });
    return res
      .status(HttpStatus.OK)
      .json({ data: dataArr, message: "Data fetched successfully" });
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

route.get("/name-of-particulars", async (req, res) => {
  try {
    const dataArr = (await ParticularsModel.find({}).lean()).map((item) => {
      const { _id, name } = item || {};
      return {
        id: _id.toString(),
        name,
      };
    });
    return res
      .status(HttpStatus.OK)
      .json({ data: dataArr, message: "Data fetched successfully" });
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

route.get("/current-stages", async (req, res) => {
  try {
    const dataArr = (await CurrentStageModel.find({}).lean()).map((item) => {
      const { _id, name } = item || {};
      return {
        id: _id.toString(),
        name,
      };
    });
    return res
      .status(HttpStatus.OK)
      .json({ data: dataArr, message: "Data fetched successfully" });
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

route.post("/add-new-court", async (req, res) => {
  try {
    const { data } = req.body || {};
    if (!data)
      return res
        .status(HttpStatus.ERROR)
        .json({ message: "Did not provide the data in here" });
    await CurrentStageModel.insertOne({ name: data });
    return res
      .status(HttpStatus.OK)
      .json({ message: "Data saved with success" });
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

route.post("/add-new-particulars", async (req, res) => {
  try {
    const { data } = req.body || {};
    if (!data)
      return res
        .status(HttpStatus.ERROR)
        .json({ message: "Did not provide the data in here" });
    await ParticularsModel.insertOne({ name: data });
    return res
      .status(HttpStatus.OK)
      .json({ message: "Data saved with success" });
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

route.post("/add-new-stage", async (req, res) => {
  try {
    const { data } = req.body || {};
    if (!data)
      return res
        .status(HttpStatus.ERROR)
        .json({ message: "Did not provide the data in here" });
    await CurrentStageModel.insertOne({ name: data });
    return res
      .status(HttpStatus.OK)
      .json({ message: "Data saved with success" });
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
