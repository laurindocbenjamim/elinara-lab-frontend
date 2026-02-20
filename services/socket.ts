import { io } from "socket.io-client";
import { config } from "../config";

const SOCKET_URL = config.SOCKET_URL;

export const socket = io(SOCKET_URL, {
    path: "/api/socket.io",
    transports: ["polling", "websocket"],
    reconnection: true,
    autoConnect: true,
    withCredentials: true,
});
