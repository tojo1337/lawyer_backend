import path from "path";
import mongoose from "mongoose";
import { Router } from "express";
import { logger } from "../config/pino.config.js";
import { HttpStatus } from "../enum/http-status.js";
import jwtMiddleware from "../middleware/jwt.middleware.js";
import { FileModel } from "../model/file.model.js";
import * as helper from "../utils/helper.js";
import * as common from "../utils/commons.js";
import { CaseModel } from "../model/case.model.js";
import { unlink } from "fs/promises";

const route = Router();

route.use(jwtMiddleware);

route.post("/upload-case-file", async (req, res) => {
  try {
    const { id } = req?.userData || {};
    const form = helper.createFormidable();
    const [fields, files] = await form.parse(req);
    const fileInfo = files?.file[0] || {};
    const caseId = fields?.caseId[0] || "";
    if (!fileInfo || !caseId || !id)
      return res.status(HttpStatus.ERROR).json({
        message:
          "Either id or file or associated case id was not attached with the request",
      });
    const [caseData] = await CaseModel.find({
      _id: new mongoose.Types.ObjectId(caseId),
      case_owner: new mongoose.Types.ObjectId(id),
    }).lean();
    await FileModel.insertOne({
      case_link: new mongoose.Types.ObjectId(caseId),
      file_name: fileInfo.originalFilename,
      file_path: fileInfo.filepath,
      mime_type: fileInfo.mimetype,
      file_size: fileInfo.size,
      is_deleted: caseData.is_deleted || false,
      is_case_completed: caseData.is_completed || false,
    });
    return res
      .status(HttpStatus.OK)
      .json({ message: "File uploaded successfully" });
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

route.get("/get-linked-uploaded-files", async (req, res) => {
  try {
    const { id } = req?.userData || {};
    const { caseId, page = "1", limit = "10" } = req.query || {};
    if (!id || !caseId || caseId === "")
      return res
        .status(HttpStatus.ERROR)
        .json({ message: "Both id and caseId are required" });

    const pageVal = Number.isInteger(Number(page)) ? Number(page) : 1;
    const limitVal = Number.isInteger(Number(limit)) ? Number(limit) : 10;
    const startIndex = (pageVal - 1) * limitVal;
    const endIndex = pageVal * limitVal;

    const [caseData, fileData] = await helper.promiseCaller([
      CaseModel.find({
        _id: new mongoose.Types.ObjectId(caseId),
        case_owner: new mongoose.Types.ObjectId(id),
        is_deleted: false,
        is_completed: false,
      }).lean(),
      FileModel.find({
        case_link: new mongoose.Types.ObjectId(caseId),
        is_deleted: false,
      })
        .skip(startIndex)
        .limit(endIndex)
        .lean(),
    ]);
    if (!caseData.length)
      return res
        .status(HttpStatus.ERROR)
        .json({ message: "Case with the following id deosn't exist" });
    const payload = (fileData || []).map((item) => {
      const { _id, file_name, file_size } = item || {};
      return {
        fileId: _id.toString(),
        fileName: file_name,
        fileSize: file_size,
      };
    });
    return res.status(HttpStatus.OK).json({
      message: "Fetched all the files off the user",
      data: payload || [],
    });
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

  route.get("/download-linked-file/:fileId", async (req, res) => {
    try {
      const { id } = req?.userData || {};
      const { fileId } = req.params || {};
      if (!id || !fileId)
        return res
          .status(HttpStatus.ERROR)
          .json({ message: "Both id and fileId are required" });
      const targetFile = await FileModel.findOne({
        _id: new mongoose.Types.ObjectId(fileId),
        is_deleted: false,
      }).lean();
      const caseEntry = await CaseModel.findOne({
        _id: new mongoose.Types.ObjectId(targetFile.case_link),
        case_owner: new mongoose.Types.ObjectId(id),
        is_deleted: false,
      }).lean();
      if (!caseEntry)
        return res
          .status(HttpStatus.ERROR)
          .json({ message: "No parent case found" });
      if (!targetFile)
        return res.status(HttpStatus.NOT_FOUND).json({ error: "File not found" });
      res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
      res.setHeader("Content-Length", (targetFile.file_size || 0).toString());
      res.set(
        "Content-Type",
        targetFile.mime_type || "application/octet-stream",
      );
      return res.download(targetFile.file_path, targetFile.file_name);
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

route.get("/remove-linked-file", async (req, res) => {
  try {
    const { id = "" } = req.userData || {};
    const { caseId = "", fileId = "" } = req.query || {};
    if (!id || !caseId || !fileId)
      return res
        .status(HttpStatus.ERROR)
        .json({ message: "Missning caseId or fileId" });
    const [authUser, fileRes] = await helper.promiseCaller([
      CaseModel.find({
        _id: new mongoose.Types.ObjectId(caseId),
        case_owner: new mongoose.Types.ObjectId(id),
      }).lean(),
      FileModel.findOne({
        _id: new mongoose.Types.ObjectId(fileId),
        case_link: new mongoose.Types.ObjectId(caseId),
      }).lean(),
    ]);
    if (!authUser.length)
      return res
        .status(HttpStatus.ERROR)
        .json({ message: "User not authorized to perform the given action" });
    await helper.promiseCaller([
      unlink(fileRes.file_path),
      FileModel.updateOne(
        {
          _id: new mongoose.Types.ObjectId(fileId),
          case_link: new mongoose.Types.ObjectId(caseId),
        },
        { $set: { is_deleted: true } },
      ),
    ]);
    return res
      .status(HttpStatus.OK)
      .json({ message: "File delted with success" });
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
