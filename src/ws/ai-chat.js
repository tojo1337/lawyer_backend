import { logger } from "../config/pino.config.js";

export default function aiChat(io, socket) {
  socket.on("msg", async (recvData) => {
    try {
      //   Implement the rag based search in here using this
    } catch (err) {
      logger.error({
        error: err.stack,
      });
    }
  });
}
