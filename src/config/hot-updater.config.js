import { createHotUpdater } from "@hot-updater/server";
import { mongoAdapter } from "@hot-updater/server/adapters/mongodb";
import { apiKeys, insights } from "@hot-updater/server/plugins";
import { s3Storage } from "@hot-updater/aws";
import { existsSync } from "node:fs";
import { MongoClient } from "mongodb";

if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

export const client = new MongoClient(process.env.UPDATER_DB_CONNECTOR);

await client.connect();

export const hotUpdater = createHotUpdater({
  database: mongoAdapter({ client }),
  plugins: [insights(), apiKeys()],
  storage: s3Storage({
    region: process.env.S3_REGION,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_KEY,
    },
    bucketName: process.env.BUCKET_NAME,
  }),
});
