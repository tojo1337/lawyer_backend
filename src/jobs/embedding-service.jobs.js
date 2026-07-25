import { embedMany } from "ai";
import mongoose from "mongoose";
import { MDocument } from "@mastra/rag";
import * as helper from "../utils/helper.js";
import * as common from "../utils/commons.js";
import { logger } from "../config/pino.config.js";
import { agenda } from "../config/agenda.config.js";
import { AgendaJobs } from "../enum/agenda-jobs.js";
import { TokenModel } from "../model/token.model.js";
import { vectorDb } from "../db/vector-db.connector.js";
import { ModelRouterEmbeddingModel } from "@mastra/core/llm";
import { vectorCollections } from "../enum/vector-collections.js";

// Need to test this vector embedding as it will probably crash
agenda.define(AgendaJobs.processJsonService, async (job) => {
  try {
    const { case_owner, id, ...payload } = job.attrs.data || {};
    if (!case_owner || !id || !payload) return;
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
    const metaVal = (embeddings || []).map(() => ({ id, case_owner }));
    await vectorDb.upsert({
      indexName: vectorCollections.caseDataVec,
      vectors: embeddings,
      metadata: metaVal,
    });
  } catch (err) {
    logger.error({
      error: err.stack,
    });
  }
});

// Need to add vector embedding for pdf files
agenda.define();
