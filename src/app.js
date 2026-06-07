import "dotenv/config";
import cors from "cors";
import "./jobs/index.jobs.js";
import { createServer } from "http";
import express, { json } from "express";
import dbConnector from "./db/db.connector.js";
import { logger } from "./config/pino.config.js";
import { appConfig } from "./config/app.config.js";
import { route as authRoute } from "./routes/auth.route.js";
import { route as pingRoute } from "./routes/ping.route.js";
import { rotue as recordRoute } from "./routes/record.route.js";
import { agenda } from "./config/agenda.config.js";

const app = express();
const server = createServer(app);

async function main() {
  app.use(json());

  try {
    await dbConnector();
    await agenda.start();

    app.use("/test", pingRoute);
    app.use("/auth", authRoute);
    app.use("/record", recordRoute);

    server.listen(appConfig.port, () => {
      logger.info(`Server started at port : ${appConfig.port}`);
      console.log(`[*] Server started at port : ${appConfig.port}`);
    });
  } catch (err) {
    throw err;
  }
}

main().catch((err) => logger.error(err.stack));
