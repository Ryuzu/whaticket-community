import openSocket from "socket.io-client";
import { getBackendUrl } from "../config";

function connectToSocket() {
  const token = localStorage.getItem("token");
  const parsedToken = token ? JSON.parse(token) : "";

  return openSocket(getBackendUrl(), {
    transports: ["websocket", "polling"],
    auth: {
      token: parsedToken,
    },
    autoConnect: Boolean(parsedToken),
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
  });
}

export default connectToSocket;