import { Server } from "socket.io";

class SocketConfig {
  #io;
  #server;
  #config;
  static instance;

  constructor() {
    if (SocketConfig.instance) {
      return SocketConfig.instance;
    }
    SocketConfig.instance = this;
  }

  set server(httpServer) {
    this.#server = httpServer;
  }

  set config(socketConfig) {
    this.#config = socketConfig;
  }

  set io(ioConfig){
    this.#io = ioConfig;
  }

  get server() {
    if (!this.#server)
      throw new Error("Set server before calling server getter");
    return this.#server;
  }

  get config() {
    if (!this.#config)
      throw new Error("Set config object before calling getter for config");
    return this.#config;
  }

  get io(){
    return this.#io;
  }

  makeSocket() {
    if (this.#io) return this.#io;
    this.#io = new Server(this.server, this.config);
    return this.#io;
  }
}

export const socketService = new SocketConfig();
