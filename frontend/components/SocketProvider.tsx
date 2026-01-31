'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { socket } from '@/lib/socket';

type SocketContextType = {
    isConnected: boolean;
    socket: typeof socket;
};

const SocketContext = createContext<SocketContextType>({
    isConnected: false,
    socket: socket,
});

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        function onConnect() {
            setIsConnected(true);
            console.log('socket connected');
        }

        function onDisconnect() {
            setIsConnected(false);
            console.log('socket disconnected');
        }

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);

        // Connect immediately when provider mounts
        socket.connect();

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={{ isConnected, socket }}>
            {children}
        </SocketContext.Provider>
    );
};
