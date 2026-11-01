import { MongoClient } from "mongodb";
import { appConfig } from "../config/app.config.js";

class HotUpdaterDbConnector {
  static instance;
  #connection;
  #db;
  constructor() {
    if (HotUpdaterDbConnector.instance) {
      return HotUpdaterDbConnector.instance;
    }
    try {
      this.#connection = new MongoClient(appConfig.appDb);
      this.#db = this.#connection.db();
      HotUpdaterDbConnector.instance = this;
    } catch (err) {
      throw err;
    }
  }
  get connection() {
    return this.#connection;
  }

  get db(){
    return this.#db;
  }
}

const dbInstance = new HotUpdaterDbConnector();

const hotUpdaterDbInstance = dbInstance.connection;
const hotUpdaterDb = dbInstance.db;

export { hotUpdaterDbInstance, hotUpdaterDb };
