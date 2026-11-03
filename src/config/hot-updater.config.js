import { createHotUpdater } from "@hot-updater/server";
import { mongoAdapter } from "@hot-updater/server/adapters/mongodb";
import { apiKeys, insights } from "@hot-updater/server/plugins";
import { s3Storage } from "@hot-updater/aws";
import { existsSync } from "node:fs";
import { MongoClient } from "mongodb";

if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

/**
 * ### This is entirely the process to perform db based migration
 * The current file or a file like this will only be used for migration only
 * Rest of the thing will be done by react native project itself, no need to do anything on server side
 * Need to create a replica set for the current mongodb instance
 * It can be done using a modified mongodb.conf file
 * Here's the small modification which is needed
 * replication:
 * replSetName: rs0
 * And it will be modified on /etc/mongod.conf and it can be done the same on docker instance
 * Then inside mongosh do the following 
 * rs.initiate()
 * rs.status()
 * restart mongodb after modification
 */

export const client = new MongoClient(process.env.UPDATER_DB_CONNECTOR, {
  retryWrites: false,
});

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
