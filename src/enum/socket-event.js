export const SocketEvent = Object.freeze({
  connect: "connection",
  disconnect: "disconnect",
  private_chat: "socket:chat",
  active_list: "socket:users",
  active_list_event: "socket:users_evt",
  key_exchange: "socket:secure",
  file_share: "socket:file_share"
});
