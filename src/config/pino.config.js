import pino from "pino";
import { appConfig } from "./app.config.js";

// Use this log file for production
// const logFilePath = `./log/app-log-${new Date().toDateString().replaceAll(/\s/g, "-")}.log`;
const logFilePath = `./log/app-log.log`;

const multiConfigSystem = {
  dev: {
    level: "error",
    transport: {
      target: "pino/file",
      options: { 
        destination: logFilePath,
        mkdir: true,
        sync: true 
      },
    },
  },
  prod: {
    level: "info",
    transport: {
      target: "pino/file",
      options: { 
        destination: logFilePath,
        mkdir: true,
        sync: true 
      },
    },
  },
};

const config = multiConfigSystem[appConfig.release];

export const logger = pino(config);
