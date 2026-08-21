import { embedMany } from "ai";
import mongoose from "mongoose";
import { MDocument } from "@mastra/rag";
import { randomUUID as uuid } from "crypto";
import * as helper from "../utils/helper.js";
import * as common from "../utils/commons.js";
import { logger } from "../config/pino.config.js";
import { agenda } from "../config/agenda.config.js";
import { AgendaJobs } from "../enum/agenda-jobs.js";
import { TokenModel } from "../model/token.model.js";
import { vectorDb } from "../db/vector-db.connector.js";
import { ModelRouterEmbeddingModel } from "@mastra/core/llm";
import { vectorCollections } from "../enum/vector-collections.js";
import { CourtNameModel } from "../model/court-name.model.js";
import { ParticularsModel } from "../model/particulars.model.js";
import { CurrentStageModel } from "../model/current-stage.mdoel.js";
import { VectorTrackerModel } from "../model/vector-tracker.model.js";

// Need to test this vector embedding as it will probably crash
agenda.define(AgendaJobs.processJsonService, async (job) => {
  try {
    const {
      case_owner,
      id,
      court_name,
      current_stage,
      case_particulars,
      ...payload
    } = job.attrs.data || {};
    if (!case_owner || !id || !payload) return;
    const [courtNames, particulars, currentStage] = await helper.promiseCaller([
      () => CourtNameModel.find({}).lean(),
      () => ParticularsModel.find({}).lean(),
      () => CurrentStageModel.find({}).lean(),
    ]);
    const courtNameItem = courtNames.find(
      (item) => item._id.toString() === court_name,
    );
    const particularsItem = particulars.find(
      (item) => item._id.toString() === case_particulars,
    );
    const currentStafeItem = currentStage.find(
      (item) => item._id.toString() === current_stage,
    );
    payload["court_name"] = courtNameItem.name || "";
    payload["current_stage"] = currentStafeItem.name || "";
    payload["case_particulars"] = particularsItem.name || "";
    const document = MDocument.fromText(JSON.stringify(payload));
    const docChunk = await document.chunk({
      strategy: "json",
      maxSize: 100,
      overlap: 10,
    });
    const { embeddings } = await embedMany({
      model: new ModelRouterEmbeddingModel("google/gemini-embedding-001"),
      values: docChunk.map((chunk) => chunk.text),
    });
    const uuidMap = (embeddings || []).map(() => uuid());
    const metaVal = (embeddings || []).map((_, index) => ({
      id,
      case_owner,
    }));
    await vectorDb.upsert({
      indexName: vectorCollections.caseDataVec,
      vectors: embeddings,
      metadata: metaVal,
      ids: uuidMap,
    });
    const dbCallMapper = uuidMap.map((embedding_id) => {
      return { owner_id: id, case_id: case_owner, embedding_id };
    });
    await VectorTrackerModel.insertMany(dbCallMapper);
  } catch (err) {
    logger.error({
      error: err.stack,
    });
  }
});

// Need to add vector embedding for pdf files
agenda.define();
