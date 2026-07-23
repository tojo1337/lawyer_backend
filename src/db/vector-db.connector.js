import { MongoDBVector } from "@mastra/mongodb";
import { appConfig } from "../config/app.config.js";

// Agenda singleton class
class VectorDbInstance {
  static instance;
  #connection;
  constructor() {
    if (VectorDbInstance.instance) {
      return VectorDbInstance.instance;
    }
    try {
      const mongo_address = appConfig.appDb;
      this.connection = new MongoDBVector({
        id: "mongodb-vector",
        uri: appConfig.vectorDbUri,
        dbName: appConfig.vectorDbName
      });
      VectorDbInstance.instance = this;
    } catch (err) {
      throw err;
    }
  }
  get connection() {
    return this.#connection;
  }
  set connection(connectionInfo) {
    this.#connection = connectionInfo;
  }
}

const dbInstance = new VectorDbInstance();

const vectorDb = dbInstance.connection;

export { vectorDb };
