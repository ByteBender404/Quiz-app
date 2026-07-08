import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Server, Shield, Play } from 'lucide-react';
import { socket } from '../socket';
import { API_URL } from '../config';

interface Quiz {
  _id: string;
  title: string;
  category: string;
}

const MultiplayerLobby: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'select' | 'host' | 'join' | 'lobby'>('select');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string>('');
  const [roomCode, setRoomCode] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [players, setPlayers] = useState<{ username: string; score: number }[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [username, setUsername] = useState('PLAYER');

  useEffect(() => {
    const fetchUserAndQuizzes = async () => {
      try {
        const [userRes, quizRes] = await Promise.all([
          fetch(`${API_URL}/api/auth/me`, { credentials: 'include' }),
          fetch(`${API_URL}/api/v1/quizzes`, { credentials: 'include' })
        ]);
        
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.success && userData.data?.user) {
            setUsername(userData.data.user.username);
          }
        }
        
        if (quizRes.ok) {
          const quizData = await quizRes.json();
          if (quizData.success && quizData.data?.quizzes) {
            setQuizzes(quizData.data.quizzes);
          }
        }
      } catch (err) {
        console.error('Failed to fetch data', err);
      }
    };
    fetchUserAndQuizzes();

    // Socket event listeners
    socket.on('player_joined', (data) => {
      setPlayers(data.players);
      if (data.hostUsername === username) {
        setIsHost(true);
      }
    });

    socket.on('player_left', (data) => {
      setPlayers(data.players);
      if (data.hostUsername === username) {
        setIsHost(true);
      }
    });

    socket.on('game_started', (data) => {
      navigate(`/quiz/${data.quizId}?roomCode=${data.roomCode}`);
    });

    socket.on('assigned_as_host', (data) => {
      setIsHost(true);
      if (data && data.quizId) {
        setSelectedQuizId(data.quizId);
      }
    });

    return () => {
      socket.off('player_joined');
      socket.off('player_left');
      socket.off('game_started');
      socket.off('assigned_as_host');
      socket.disconnect();
    };
  }, [navigate]);

  const handleHostMatch = () => {
    if (!selectedQuizId) return alert('Select a quiz first!');
    
    // Generate random 6 character alphanumeric code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomCode(code);
    setIsHost(true);
    setMode('lobby');

    socket.connect();
    socket.emit('join_room', { roomCode: code, username, quizId: selectedQuizId });
  };

  const handleJoinMatch = () => {
    if (!joinCodeInput.trim() || joinCodeInput.length !== 6) {
      return alert('Enter a valid 6-character room code.');
    }
    
    const code = joinCodeInput.toUpperCase();
    setRoomCode(code);
    setIsHost(false);
    setMode('lobby');

    socket.connect();
    socket.emit('join_room', { roomCode: code, username });
  };

  const launchMatch = () => {
    if (isHost && roomCode) {
      socket.emit('start_game', { roomCode, quizId: selectedQuizId });
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-12 font-mono flex items-center justify-center">
      <div className="w-full max-w-4xl">
        <header className="mb-12 text-center">
          <h1 className="text-headline-lg font-bold text-on-surface mb-2 tracking-tight flex items-center justify-center gap-4">
            <Server className="text-secondary animate-pulse" size={48} />
            MULTIPLAYER ARENA
          </h1>
          <p className="text-body-md text-on-surface-variant uppercase tracking-widest text-xs">
            ESTABLISH A SECURE CONNECTION TO THE LOBBY NETWORK
          </p>
        </header>

        {mode === 'select' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div 
              onClick={() => setMode('host')}
              className="glass-card bg-gradient-to-br from-surface-container to-primary/10 border-primary/30 hover:border-primary transition-all cursor-pointer p-12 text-center group"
            >
              <Shield size={64} className="mx-auto mb-6 text-primary group-hover:scale-110 transition-transform" />
              <h2 className="text-title-lg font-bold text-on-surface mb-4">HOST MATCH</h2>
              <p className="text-on-surface-variant text-sm">Create a secure room, select a module, and invite operators.</p>
            </div>
            
            <div 
              onClick={() => setMode('join')}
              className="glass-card bg-gradient-to-br from-surface-container to-secondary/10 border-secondary/30 hover:border-secondary transition-all cursor-pointer p-12 text-center group"
            >
              <Users size={64} className="mx-auto mb-6 text-secondary group-hover:scale-110 transition-transform" />
              <h2 className="text-title-lg font-bold text-on-surface mb-4">JOIN MATCH</h2>
              <p className="text-on-surface-variant text-sm">Input a 6-digit access code to deploy into an active room.</p>
            </div>
          </div>
        )}

        {mode === 'host' && (
          <div className="glass-card p-8">
            <h2 className="text-title-lg font-bold text-on-surface mb-6 border-b border-surface-container-high pb-4">SELECT MODULE TO HOST</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto mb-8 pr-2">
              {quizzes.map(quiz => (
                <div 
                  key={quiz._id}
                  onClick={() => setSelectedQuizId(quiz._id)}
                  className={`p-4 rounded border cursor-pointer transition-colors ${
                    selectedQuizId === quiz._id 
                      ? 'bg-primary/20 border-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]' 
                      : 'bg-surface-container border-surface-container-high hover:border-primary/50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-on-surface">{quiz.title}</h3>
                    <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded">{quiz.category}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between">
              <button onClick={() => setMode('select')} className="text-on-surface-variant hover:text-on-surface transition-colors font-bold tracking-widest text-sm uppercase">← BACK</button>
              <button onClick={handleHostMatch} disabled={!selectedQuizId} className="btn-primary px-8 py-3 font-bold uppercase tracking-widest text-sm disabled:opacity-50">INITIALIZE LOBBY</button>
            </div>
          </div>
        )}

        {mode === 'join' && (
          <div className="glass-card p-12 text-center max-w-lg mx-auto">
            <h2 className="text-title-lg font-bold text-on-surface mb-8">ENTER ACCESS CODE</h2>
            <input 
              type="text" 
              maxLength={6}
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
              placeholder="XXXXXX" 
              className="w-full bg-surface-container border border-primary/50 text-center text-4xl tracking-[1em] py-6 mb-8 text-on-surface rounded font-bold outline-none focus:border-secondary focus:shadow-[0_0_15px_rgba(var(--secondary-rgb),0.3)] transition-all uppercase"
            />
            <div className="flex justify-between items-center">
              <button onClick={() => setMode('select')} className="text-on-surface-variant hover:text-on-surface transition-colors font-bold tracking-widest text-sm uppercase">← BACK</button>
              <button onClick={handleJoinMatch} disabled={joinCodeInput.length !== 6} className="bg-secondary text-on-secondary px-8 py-3 rounded uppercase font-bold tracking-widest text-sm hover:bg-secondary-fixed transition-colors disabled:opacity-50">CONNECT</button>
            </div>
          </div>
        )}

        {mode === 'lobby' && (
          <div className="glass-card p-8 border-secondary/50 shadow-[0_0_30px_rgba(var(--secondary-rgb),0.1)]">
            <div className="text-center mb-12">
              <p className="text-on-surface-variant text-sm font-bold tracking-widest uppercase mb-2">ROOM ACCESS CODE</p>
              <h2 className="text-6xl font-bold text-secondary tracking-[0.2em]">{roomCode}</h2>
            </div>

            <div className="mb-12">
              <h3 className="text-title-md font-bold text-on-surface border-b border-surface-container-high pb-4 mb-6 flex justify-between">
                <span>CONNECTED OPERATORS</span>
                <span className="text-secondary">{players.length} / 10</span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {players.map((p, idx) => (
                  <div key={idx} className="bg-surface-container border border-surface-container-high p-4 rounded flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary/20 text-secondary flex items-center justify-center font-bold text-xs">
                      {p.username.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="font-bold text-on-surface truncate">{p.username}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center border-t border-surface-container-high pt-8">
              {isHost ? (
                <button 
                  onClick={launchMatch} 
                  disabled={players.length < 2}
                  className={`btn-primary flex items-center gap-2 px-12 py-4 text-lg shadow-[0_0_20px_rgba(var(--primary-rgb),0.5)] ${players.length >= 2 ? 'animate-pulse' : 'opacity-50 grayscale cursor-not-allowed'}`}
                >
                  <Play size={24} />
                  {players.length < 2 ? 'NEED MINIMUM 2 OPERATORS' : 'LAUNCH MATCH'}
                </button>
              ) : (
                <div className="text-secondary font-bold tracking-widest uppercase flex items-center gap-3 animate-pulse">
                  <span className="w-3 h-3 rounded-full bg-secondary"></span>
                  WAITING FOR HOST TO LAUNCH...
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiplayerLobby;
