const { Server } = require('socket.io');
const Question = require('../modules/quizzes/question.model');

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: [process.env.FRONTEND_URL || 'http://localhost:5173'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // In-memory store for active rooms
  // Structure: { [roomCode]: { players: { socketId: { username, score } }, hasStarted: boolean } }
  const rooms = {};

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join a specific room
    socket.on('join_room', ({ roomCode, username, quizId }) => {
      if (!roomCode || !username) return;

      socket.join(roomCode);

      if (!rooms[roomCode]) {
        rooms[roomCode] = { players: {}, hasStarted: false, quizId, hostUsername: username, completedCount: 0, timerId: null, matchConcluded: false };
      }

      rooms[roomCode].players[socket.id] = { username, score: 0, accuracy: 0, isFinished: false };
      
      console.log(`[JOIN] Socket ${socket.id} joining room ${roomCode}`);
      console.log(`[JOIN] Incoming Username: "${username}"`);
      console.log(`[JOIN] Room HostUsername: "${rooms[roomCode].hostUsername}"`);

      // Broadcast to everyone in the room that a player joined
      io.to(roomCode).emit('player_joined', {
        hostUsername: rooms[roomCode].hostUsername,
        username,
        players: Object.values(rooms[roomCode].players)
      });

      const storedHost = rooms[roomCode].hostUsername || '';
      const incomingUser = username || '';
      
      if (storedHost.trim().toLowerCase() === incomingUser.trim().toLowerCase()) {
        console.log(`[HOST ASSIGNED] Re-elevating ${username} as host in ${roomCode}`);
        socket.emit('assigned_as_host', { quizId: rooms[roomCode].quizId });
      }
    });

    // Start game
    socket.on('start_game', async ({ roomCode, quizId }) => {
      if (rooms[roomCode]) {
        rooms[roomCode].hasStarted = true;
        rooms[roomCode].quizId = quizId;
        
        io.to(roomCode).emit('game_started', { quizId, roomCode });
        console.log(`Game started in room ${roomCode} for module ${quizId}`);

        try {
          const totalQuestions = await Question.countDocuments({ quizId });
          const totalTimeMs = (totalQuestions || 1) * 15 * 1000;
          
          if (rooms[roomCode].timerId) clearTimeout(rooms[roomCode].timerId);
          
          rooms[roomCode].timerId = setTimeout(() => {
            if (rooms[roomCode] && !rooms[roomCode].matchConcluded) {
              rooms[roomCode].matchConcluded = true;
              const sortedLeaderboard = Object.values(rooms[roomCode].players).sort((a, b) => b.score - a.score);
              console.log("Broadcasting match_concluded with data:", sortedLeaderboard);
              io.to(roomCode).emit('match_concluded', sortedLeaderboard);
              console.log(`Match timer expired in room ${roomCode}`);
            }
          }, totalTimeMs);
        } catch (err) {
          console.error('Failed to start timer', err);
        }
      }
    });

    // Handle score submission
    socket.on('submit_score', ({ roomCode, username, score, accuracy }) => {
      if (rooms[roomCode] && rooms[roomCode].players[socket.id]) {
        rooms[roomCode].players[socket.id].score = score;
        if (accuracy !== undefined) rooms[roomCode].players[socket.id].accuracy = accuracy;
        
        // Sort leaderboard
        const leaderboard = Object.values(rooms[roomCode].players).sort((a, b) => b.score - a.score);
        
        io.to(roomCode).emit('score_update', { leaderboard });
      }
    });

    // Handle player completion
    socket.on('player_completed', ({ roomCode, score, accuracy }) => {
      if (rooms[roomCode] && rooms[roomCode].players[socket.id]) {
        // Securely override final score
        if (score !== undefined) rooms[roomCode].players[socket.id].score = score;
        if (accuracy !== undefined) rooms[roomCode].players[socket.id].accuracy = accuracy;

        if (!rooms[roomCode].players[socket.id].isFinished) {
          rooms[roomCode].players[socket.id].isFinished = true;
          rooms[roomCode].completedCount += 1;
          
          const totalPlayers = Object.keys(rooms[roomCode].players).length;
          console.log(`Player completed in room ${roomCode}. ${rooms[roomCode].completedCount}/${totalPlayers} finished.`);
          
          if (rooms[roomCode].completedCount >= totalPlayers) {
            if (rooms[roomCode].timerId) clearTimeout(rooms[roomCode].timerId);
            
            if (!rooms[roomCode].matchConcluded) {
              rooms[roomCode].matchConcluded = true;
              const sortedLeaderboard = Object.values(rooms[roomCode].players).sort((a, b) => b.score - a.score);
              console.log("Broadcasting match_concluded with data:", sortedLeaderboard);
              io.to(roomCode).emit('match_concluded', sortedLeaderboard);
              console.log(`All players finished in room ${roomCode}. Match concluded.`);
            }
          }
        }
      }
    });

    // Hard Stop Fallback
    socket.on('force_match_end', ({ roomCode }) => {
      if (rooms[roomCode]) {
        if (rooms[roomCode].matchConcluded) return;
        
        if (rooms[roomCode].timerId) clearTimeout(rooms[roomCode].timerId);
        
        rooms[roomCode].matchConcluded = true;
        const sortedLeaderboard = Object.values(rooms[roomCode].players).sort((a, b) => b.score - a.score);
        console.log("Broadcasting match_concluded with data:", sortedLeaderboard);
        io.to(roomCode).emit('match_concluded', sortedLeaderboard);
        console.log(`Match force-ended by client in room ${roomCode}`);
      }
    });

    // Cleanup on disconnect
    socket.on('disconnect', () => {
      for (const roomCode in rooms) {
        if (rooms[roomCode].players[socket.id]) {
          const username = rooms[roomCode].players[socket.id].username;
          delete rooms[roomCode].players[socket.id];
          
          io.to(roomCode).emit('player_left', {
            hostUsername: rooms[roomCode].hostUsername,
            username,
            players: Object.values(rooms[roomCode].players)
          });
          
          if (Object.keys(rooms[roomCode].players).length === 0) {
            if (rooms[roomCode].timerId) {
              clearTimeout(rooms[roomCode].timerId);
              rooms[roomCode].timerId = null;
            }
            // Keep room alive for zombie host recovery, but clear the timer so it doesn't fire on an empty room
          }
        }
      }
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

module.exports = initSocket;
