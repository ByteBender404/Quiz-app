import { io, Socket } from 'socket.io-client';

// 'autoConnect: false' ensures we only connect when we explicitly want to (e.g., entering the multiplayer lobby)
export const socket: Socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
  autoConnect: false,
  withCredentials: true,
});
