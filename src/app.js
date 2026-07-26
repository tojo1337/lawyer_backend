import "dotenv/config";
import cors from "cors";
import "./jobs/index.jobs.js";
import { createServer } from "http";
import express, { json } from "express";
import dbConnector from "./db/db.connector.js";
import { logger } from "./config/pino.config.js";
import { appConfig } from "./config/app.config.js";
import { agenda } from "./config/agenda.config.js";
import { vectorDb } from "./db/vector-db.connector.js";
import { route as authRoute } from "./routes/auth.route.js";
import { route as pingRoute } from "./routes/ping.route.js";
import { route as casesRoute } from "./routes/cases.route.js";
import { route as commonRoute } from "./routes/common.route.js";
import { route as caseFileRoute } from "./routes/case-file.route.js";
import { vectorCollectionCreator } from "./utils/vector-collection-creator.js";
import { socketService } from "./config/socket.config.js";
import { SocketEvent } from "./enum/socket-event.js";
import { EventTypes } from "./enum/events.js";
import { socketMiddleware } from "./middleware/socket.middleware.js";

const app = express();
const server = createServer(app);

const socketServiceWrapper = socketService;
socketServiceWrapper.server = server;
socketServiceWrapper.config = {};
const io = socketServiceWrapper.makeSocket();

async function main() {
  app.use(json());

  try {
    await dbConnector();
    await agenda.start();
    await vectorCollectionCreator();

    app.use("/test", pingRoute);
    app.use("/auth", authRoute);
    app.use("/cases", casesRoute);
    app.use("/common", commonRoute);
    app.use("/case-file", caseFileRoute);

    // Add socket.io related things in here
    io.use(socketMiddleware);
    io.on(SocketEvent.connect, (socket) => {
      // Add action over here
      // chatApp(io, socket);

      // Clean up
      socket.on(SocketEvent.disconnect, async () => {
        // let wsData = socket.wsData;
        // if (wsData) {
        //   await sokcetDisconnectionHandler(wsData.uuid);
        //   const remainingUserList = await getAllActiveUsers();
        //   io.emit(SocketEvent.active_list, remainingUserList);
        // }
      });
    });

    server.listen(appConfig.port, () => {
      logger.info(`Server started at port : ${appConfig.port}`);
      console.log(`[*] Server started at port : ${appConfig.port}`);
    });
  } catch (err) {
    throw err;
  }
}

async function explicitShutdown(signal) {
  try {
    await agenda.stop();
    io.close();
    server.close();
    logger.error({ signal }, "Interrupted");
    // await putUsersOffline();
  } catch (err) {
    logger.error(`Something went wrong : ${err.stack}`);
  } finally {
    process.exit(0);
  }
}

process.on(EventTypes.unhandledRejection, (reason) => {
  logger.error({ reason }, "Unhandled Rejection");
});

process.on(EventTypes.uncaughtException, (err) => {
  logger.error({ err }, "Uncaught Exception");
});

// Interrupt handler
process.on(EventTypes.sigint, explicitShutdown);
process.on(EventTypes.sigterm, explicitShutdown);
process.on(EventTypes.sigquit, explicitShutdown);

main().catch((err) => logger.error(err.stack));
