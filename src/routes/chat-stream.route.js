import { embed } from "ai";
import { response, Router } from "express";
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
import jwtMiddleware from "../middleware/jwt.middleware.js";
import { ChatHistoryModel } from "../model/chat-history.model.js";
import mongoose from "mongoose";
import * as helper from "../utils/helper.js";
import { DateTime } from "luxon";

const route = Router();

route.use(jwtMiddleware);

const courtDiaryChatAgent = new Agent({
  id: "court-diary-chat-agent",
  name: "court diary chat agent",
  instructions: `
                You are a helpful assistant that answers questions using retrieved case data.
                Rules:
                - Use the provided context as the primary source of truth.
                - Do not invent facts that are not present in the context.
                - If the context does not contain enough information to answer the question,
                  clearly say that you do not have enough information.
                - Give a concise and direct answer.
                - Do not mention internal relevance scores or the reranking process.
                `,
  model: appConfig.aiModel,
});

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

    // This need to check this one out properly
    const currentDate = DateTime.now();
    const [currentPlan, recordedChats] = await helper.promiseCaller([
      () => helper.getCurrentPlan(id),
      () =>
        ChatHistoryModel.find({
          chat_owner: new mongoose.Types.ObjectId(id),
          created_at: {
            $gte: currentDate.startOf("day").toJSDate(),
            $lte: currentDate.endOf("day").toJSDate(),
          },
        }).lean(),
    ]);

    if (currentPlan.chat_per_day < recordedChats.length + 1)
      return res.end("chat limit reached for current date");

    // These are required for streaming
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");

    const { embedding: resultingEmbedding } = await embed({
      value: chat_data,
      model: new ModelRouterEmbeddingModel(appConfig.embedModel),
    });
    const fetchFromDb = await vectorDb.query({
      indexName: vectorCollections.caseDataVec,
      queryVector: resultingEmbedding,
      topK: Number.isInteger(Number(appConfig.topkValue))
        ? Number(appConfig.topkValue)
        : 10,
      filter: {
        // must: [
        //   {
        //     key: 'case_owner',
        //     match: {
        //       value: id
        //     }
        //   }
        // ]
        case_owner: id,
      },
    });

    if (!fetchFromDb.length)
      return res.end("No relevant infromation found from db");

    const relevanceScorer = new MastraAgentRelevanceScorer(
      "relevance-scorer",
      appConfig.aiModel,
    );

    const rerankedData = await rerank({
      results: fetchFromDb,
      query: chat_data,
      scorer: relevanceScorer,
      options: {
        weights: {
          semantic: Number.isInteger(Number(appConfig.semanticValue))
            ? Number(appConfig.semanticValue)
            : 0.5,
          vector: Number.isInteger(Number(appConfig.vectorValue))
            ? Number(appConfig.vectorValue)
            : 0.3,
          position: Number.isInteger(Number(appConfig.positionValue))
            ? Number(appConfig.positionValue)
            : 0.2,
        },
        topK: Number.isInteger(Number(appConfig.topkValue))
          ? Number(appConfig.topkValue)
          : 10,
      },
    });

    if (!rerankedData.length) return res.end("No relevant data fount from db");

    const contextBuilding = rerankedData
      .map((item, index) => {
        const textData = item.result?.metadata?.text || "";
        return `--- SOURCE ${index + 1} ---
              ${textData}`;
      })
      .join("\n");

    const prompt = `Answer the user's question using the retrieved context below.
                    USER QUESTION:
                    ${chat_data}
                    RETRIEVED CONTEXT:
                    ${contextBuilding}
                    IMPORTANT:
                    - Answer only using information supported by the retrieved context.
                    - Do not make up information.
                    - If the context does not contain the answer, say that you don't have enough information.
                    - Do not mention relevance scores.
                    - Do not mention the reranking process.
                    Now answer the user's question.`;
    let responseData = "";
    const answer = await courtDiaryChatAgent.stream(prompt);
    for await (let chunk of answer.textStream) {
      res.write(chunk);
      responseData += chunk;
    }
    await ChatHistoryModel.insertOne({
      chat_owner: new mongoose.Types.ObjectId(id),
      chat_request: chat_data,
      chat_response: responseData,
    });
    return res.end();
  } catch (err) {
    logger.error({
      url: req.originalUrl,
      method: req.method,
      body: req.body,
      stack: err.stack,
    });
    return res.status(HttpStatus.ERROR).end("Something went wrong");
  }
});

export { route };
