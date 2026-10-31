import { MongoClient } from "mongodb";
import { appConfig } from "../config/app.config.js";

class HotUpdaterDbConnector {
  static instance;
  #connection;
  constructor() {
    if (HotUpdaterDbConnector.instance) {
      return HotUpdaterDbConnector.instance;
    }
    try {
      this.connection = new MongoClient(appConfig.appDb);
      HotUpdaterDbConnector.instance = this;
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

const dbInstance = new HotUpdaterDbConnector();

const hotUpdaterDb = dbInstance.connection;

export { hotUpdaterDb };
