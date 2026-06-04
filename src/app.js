import "dotenv/config";
import cors from "cors";
import { createServer } from "http";
import express, { json } from "express";
import { logger } from "./config/pino.config.js";
import { appConfig } from "./config/app.config.js";
import { route as authRoute } from "./routes/auth.route.js";
import { route as pingRoute } from "./routes/ping.route.js";
import dbConnector from "./db/db.connector.js";
import { agenda } from "./config/agenda.config.js";
import "./jobs/index.jobs.js";
import { passport } from "./config/passport.config.js";
import { route as webhooks } from "./routes/webhooks.route.js";

const app = express();
const server = createServer(app);

async function main() {
  app.use(json());
  app.use(passport.initialize());

  try {
    await dbConnector();
    await agenda.start();

    app.use("/test", pingRoute);
    app.use("/auth", authRoute);
    app.use("/webhooks", webhooks);

    server.listen(appConfig.port, () => {
      logger.info(`Server started at port : ${appConfig.port}`);
      console.log(`[*] Server started at port : ${appConfig.port}`);
    });
  } catch (err) {
    throw err;
  }
}

main().catch((err) => logger.error(err.stack));
