import { appConfig } from "./app.config.js";
import { S3Client } from "@aws-sdk/client-s3";

export class StorageClient {
  static #instance = null;
  static getInstance() {
    if (!StorageClient.#instance) {
      StorageClient.#instance = new S3Client({
        region: appConfig.s3Region,
        credentials: {
          accessKeyId: appConfig.s3AccessKey,
          secretAccessKey: appConfig.s3SecretKey,
        },
      });
    }
    return StorageClient.#instance;
  }
}

export const storageClient = StorageClient.getInstance();
