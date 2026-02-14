import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { config } from '../config';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
    children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Use standard /socket.io path unless a specific proxy setup is known
        const socketInstance = io(config.AGENT_BASE_URL, {
            path: '/socket.io',
            withCredentials: true,
            transports: ['polling', 'websocket'],
            autoConnect: true,
        });

        socketInstance.on('connect', () => {
            console.log('Socket.io connected');
            setIsConnected(true);
        });

        socketInstance.on('disconnect', () => {
            console.log('Socket.io disconnected');
            setIsConnected(false);
        });

        socketInstance.on('connect_error', (error) => {
            console.error('Socket.io connection error:', error);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
