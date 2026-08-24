import { embed } from "ai";
import { Router } from "express";
import {
  MastraAgentRelevanceScorer,
  MDocument,
  rerankWithScorer as rerank,
} from "@mastra/rag";
import { logger } from "../config/pino.config.js";
import { HttpStatus } from "../enum/http-status.js";
import { vectorDb } from "../db/vector-db.connector.js";
import { vectorCollections } from "../enum/vector-collections.js";
import { ModelRouterEmbeddingModel } from "@mastra/core/llm";
import { Readable } from "node:stream";
import { appConfig } from "../config/app.config.js";
import { Agent } from "@mastra/core/agent";
import {
  createAnswerRelevancyScorer,
  createBiasScorer,
} from "@mastra/evals/scorers/prebuilt";

const route = Router();

route.post("/chat-stream-data", async (req, res) => {
  try {
    const { id } = req.userData || {};
    const { chat_data = "" } = req.body || {};
    if (!id)
      return res.status(HttpStatus.ERROR).json({ message: "Not authorized" });
    if (!chat_data)
      return res
        .status(HttpStatus.ERROR)
        .json({ message: "No query was receivced" });

    // These are required for streaming
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");

    const { embeddings } = await embed({
      values: chat_data,
      model: new ModelRouterEmbeddingModel("google/gemini-embedding-001"),
    });
    const fetchFromDb = await vectorDb.query({
      indexName: vectorCollections.caseDataVec,
      queryVector: embeddings,
      topK: appConfig.topkValue,
      filter: {
        case_owner: id,
      },
    });

    const relevanceScorer = new MastraAgentRelevanceScorer(
      "relevance-scorer",
      "google/gemini-2.5-flash",
    );

    const rerankedData = rerank({
      results: fetchFromDb,
      query,
      scorer: relevanceScorer,
      options: {
        weights: {
          semantic: appConfig.semanticValue,
          vector: appConfig.vectorValue,
          position: appConfig.positionValue,
        },
        topK: appConfig.topkValue,
      },
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

export { route };
