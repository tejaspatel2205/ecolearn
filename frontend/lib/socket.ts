import { io } from 'socket.io-client';

// Use same URL as API, but base protocol
const URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const socket = io(URL, {
    autoConnect: false,
    withCredentials: true,
});
