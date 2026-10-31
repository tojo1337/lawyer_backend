import { createHotUpdater } from "@hot-updater/server";
import { mongoAdapter } from "@hot-updater/server/adapters/mongodb";
import { apiKeys, insights } from "@hot-updater/server/plugins";
import { s3Storage } from "@hot-updater/aws";
import { appConfig } from "./app.config.js";
import { hotUpdaterDb } from "../db/hot-updater-db.connector.js";

export const hotUpdater = createHotUpdater({
  database: mongoAdapter({ hotUpdaterDb }),
  plugins: [insights(), apiKeys()],
  storage: s3Storage({
    region: appConfig.s3Region,
    credentials: {
      accessKeyId: appConfig.s3AccessKey,
      secretAccessKey: appConfig.s3SecretKey,
    },
    bucketName: appConfig.s3Storage,
  }),
});
