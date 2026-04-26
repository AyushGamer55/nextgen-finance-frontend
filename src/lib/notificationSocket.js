import { io } from "socket.io-client";
import { API_BASE_URL } from "@/lib/api.js";

let socketInstance = null;

export function connectNotificationSocket(token) {
  if (!token) {
    return null;
  }

  if (socketInstance?.connected) {
    return socketInstance;
  }

  socketInstance = io(API_BASE_URL, {
    transports: ["websocket"],
    auth: {
      token,
    },
  });

  return socketInstance;
}

export function getNotificationSocket() {
  return socketInstance;
}

export function disconnectNotificationSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
