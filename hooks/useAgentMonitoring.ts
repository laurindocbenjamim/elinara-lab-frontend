import { useEffect } from "react";
import { socket } from "../services/socket";
import { useSocket, AgentState } from "../context/SocketContext";

export interface MonitorData extends AgentState { }

export const useAgentMonitoring = (userId: string | number | undefined, agentId: string | undefined) => {
    const { agentStates } = useSocket();

    const monitorData: MonitorData = agentId && agentStates[agentId] ? agentStates[agentId] : {
        pipeline: {},
        model: "N/A",
        provider: "N/A",
        status: "idle",
        countdown: null,
        mode: "manual",
        lastUpdate: 0
    };

    useEffect(() => {
        if (!userId || !agentId) return;

        socket.emit("join", { room: `user_${userId}` });
        socket.emit("join", { room: `agent_${agentId}` });

        return () => {
            // We keep the rooms joined so that SocketContext continues to receive updates
            // but we could explicitly leave if we wanted to save bandwidth
            // socket.emit("leave", { room: `user_${userId}` });
            // socket.emit("leave", { room: `agent_${agentId}` });
        };
    }, [userId, agentId]);

    return monitorData;
};
