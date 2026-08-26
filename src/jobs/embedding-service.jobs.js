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
import { appConfig } from "../config/app.config.js";

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
    const [
      courtNames,
      particulars,
      currentStage,
      exsitingEmbeddingsOfSameCase,
    ] = await helper.promiseCaller([
      () => CourtNameModel.find({}).lean(),
      () => ParticularsModel.find({}).lean(),
      () => CurrentStageModel.find({}).lean(),
      () =>
        VectorTrackerModel.find({ owner_id: case_owner, case_id: id }).lean(),
    ]);

    // This will ensure that the update operation works perfectly
    if (exsitingEmbeddingsOfSameCase.length) {
      const embeddingIds = exsitingEmbeddingsOfSameCase.map(
        (item) => item.embedding_id,
      );
      await helper.promiseCaller([
        () =>
          VectorTrackerModel.deleteMany({ owner_id: case_owner, case_id: id }),
        () =>
          vectorDb.deletVectors({
            indexName: vectorCollections.caseDataVec,
            ids: embeddingIds,
          }),
      ]);
    }

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

    const naturalLangPayload = `
                                Date of registration: ${payload.date_of_registration}
                                Court name : ${payload.court_name}
                                Case number : ${payload.case_number}
                                Litigant : ${payload.litigant}
                                Litigant contact : ${payload.litigant_contact}
                                Case particulars : ${payload.case_particulars}
                                Year : ${payload.year}
                                Current stage : ${payload.current_stage}
                                Previous date : ${payload.previous_date}
                                Next date : ${payload.next_date}
                              `;
                              
    const document = MDocument.fromText(naturalLangPayload);
    const docChunk = await document.chunk({
      strategy: 'recursive',
      maxSize: Number.isInteger(Number(appConfig.maxChunkSize))
        ? Number(appConfig.maxChunkSize)
        : 100,
      overlap: Number.isInteger(Number(appConfig.maxOverlaps))
        ? Number(appConfig.maxOverlaps)
        : 10,
    });
    const { embeddings } = await embedMany({
      model: new ModelRouterEmbeddingModel(appConfig.embedModel),
      values: docChunk.map((chunk) => chunk.text),
    });
    const uuidMap = (embeddings || []).map(() => uuid());
    const metaVal = (embeddings || []).map((_, index) => ({
      id,
      case_owner,
      text: docChunk[index].text,
    }));
    const dbCallMapper = uuidMap.map((embedding_id) => {
      return { owner_id: case_owner, case_id: id, embedding_id };
    });

    // This is where the db insertion will occur
    await helper.promiseCaller([
      () =>
        vectorDb.upsert({
          indexName: vectorCollections.caseDataVec,
          vectors: embeddings,
          metadata: metaVal,
          ids: uuidMap,
        }),
      () => VectorTrackerModel.insertMany(dbCallMapper),
    ]);
  } catch (err) {
    logger.error({
      error: err.stack,
    });
  }
});

// Need to add vector embedding for pdf files
agenda.define(AgendaJobs.deleteJsonEmbeds, async (job) => {
  try {
    const { case_owner = "", case_id = "" } = job.attrs.data || {};
    if (!case_owner || !case_id) return;

    const existingEntry = await VectorTrackerModel.find({
      owner_id: case_owner,
      case_id: case_id,
    }).lean();
    if (!existingEntry.length) return;
    const mappedEmbIds = (existingEntry || []).map((item) => item.embedding_id);

    // Delete operation is performed in here
    await helper.promiseCaller([
      () =>
        VectorTrackerModel.deleteMany({
          owner_id: case_owner,
          case_id: case_id,
        }),
      () =>
        vectorDb.deleteVectors({
          indexName: vectorCollections.caseDataVec,
          ids: mappedEmbIds,
        }),
    ]);
  } catch (err) {
    logger.error({
      error: err.stack,
    });
  }
});
