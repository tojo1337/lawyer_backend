import "dotenv/config";
import cors from "cors";
import "./jobs/index.jobs.js";
import { createServer } from "http";
import express, { json } from "express";
import dbConnector from "./db/db.connector.js";
import { logger } from "./config/pino.config.js";
import { appConfig } from "./config/app.config.js";
import { agenda } from "./config/agenda.config.js";
import { route as authRoute } from "./routes/auth.route.js";
import { route as pingRoute } from "./routes/ping.route.js";
import { route as casesRoute } from "./routes/cases.route.js";
import { route as commonRoute } from "./routes/common.route.js";

const app = express();
const server = createServer(app);

async function main() {
  app.use(json());

  try {
    await dbConnector();
    await agenda.start();

    app.use("/test", pingRoute);
    app.use("/auth", authRoute);
    app.use("/cases", casesRoute);
    app.use("/common", commonRoute);

    server.listen(appConfig.port, () => {
      logger.info(`Server started at port : ${appConfig.port}`);
      console.log(`[*] Server started at port : ${appConfig.port}`);
    });
  } catch (err) {
    throw err;
  }
}

main().catch((err) => logger.error(err.stack));
