import { embed } from "ai";
import { Router } from "express";
import {
  MDocument,
  MastraAgentRelevanceScorer,
  rerankWithScorer as rerank,
} from "@mastra/rag";
import { logger } from "../config/pino.config.js";
import { HttpStatus } from "../enum/http-status.js";
import { vectorDb } from "../db/vector-db.connector.js";
import { vectorCollections } from "../enum/vector-collections.js";
import { ModelRouterEmbeddingModel } from "@mastra/core/llm";
import { Readable } from "node:stream";
import { appConfig } from "../config/app.config.js";

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
    const relevanceProvider = new MastraAgentRelevanceScorer(
      "relevance-scorer",
      "openai/gpt-5.6-sol",
    );

    // Response streaming
    Readable.from(
      rerank({
        results: initialResults,
        query,
        scorer: relevanceProvider,
        options: {
          weights: {
            semantic: appConfig.semanticValue,
            vector: appConfig.vectorValue,
            position: appConfig.positionValue,
          },
          topK: appConfig.topkValue,
        },
      }),
    ).pipe(res);
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
