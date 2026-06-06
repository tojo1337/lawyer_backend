import { OAuth2Client } from "google-auth-library";
import { appConfig } from "./app.config.js";

class Googleconfig {
  static instance;
  #client;
  constructor() {
    if (Googleconfig.instance) {
      return Googleconfig.instance;
    }
    try {
      this.client = new OAuth2Client(appConfig.googleClientId);
      Googleconfig.instance = this;
    } catch (err) {
      throw err;
    }
  }

  get client() {
    return this.#client;
  }

  set client(clientconfig) {
    this.#client = clientconfig;
  }
}

export const googleConf = new Googleconfig().client;
