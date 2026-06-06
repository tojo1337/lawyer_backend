import { Agenda } from "agenda";
import { appConfig } from "./app.config.js";
import { MongoBackend } from "@agendajs/mongo-backend";

// Agenda singleton class
class AgendaConfig {
  static instance;
  #connection;
  constructor() {
    if (AgendaConfig.instance) {
      return AgendaConfig.instance;
    }
    try {
      const mongo_address = appConfig.appDb;
      this.connection = new Agenda({
        backend: new MongoBackend({
          address: mongo_address,
          collection: "agenda_jobs",
        }),
        removeOnComplete: true,
      });
      AgendaConfig.instance = this;
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

export const agenda = new AgendaConfig().connection;
