import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Clock, ShieldAlert, CheckCircle, XCircle, Trophy } from 'lucide-react';
import QuizSummary from './QuizSummary';
import { socket } from '../socket';
import { API_URL } from '../config';

interface Question {
  _id: string;
  text: string;
  type: 'multiple_choice' | 'true_false' | 'fill_blank';
  options: string[];
  correctAnswers: string[];
  mediaUrl?: string;
}

interface Quiz {
  _id: string;
  title: string;
  description: string;
  category: string;
}

type GameState = 'loading' | 'playing' | 'revealed' | 'finished' | 'error' | 'waiting';

const QuizPlayer: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roomCode = searchParams.get('roomCode');

  const [gameState, setGameState] = useState<GameState>('loading');
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  
  // Scoring & Stats
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [timeSpentMs, setTimeSpentMs] = useState(0);

  // Question State
  const [timeLeft, setTimeLeft] = useState(30);
  const [globalMatchTimeLeft, setGlobalMatchTimeLeft] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [leaderboard, setLeaderboard] = useState<{username: string, score: number, accuracy?: number}[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<{username: string, score: number, accuracy?: number}[] | null>(null);
  const [matchEnded, setMatchEnded] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const globalTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await fetch(`${API_URL}/api/v1/quizzes/${quizId}`, {
          credentials: 'include'
        });
        
        if (response.status === 401) {
          navigate('/login');
          return;
        }

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch quiz');

        setQuiz(data.data.quiz);
        setQuestions(data.data.questions);
        setGameState('playing');
        setStartTime(Date.now());
        
        if (roomCode && data.data.questions) {
           setGlobalMatchTimeLeft(data.data.questions.length * 15);
        }
        
      } catch (err: any) {
        setErrorMsg(err.message);
        setGameState('error');
      }
    };
    fetchQuiz();
  }, [quizId, navigate]);

  // Socket connection for multiplayer
  useEffect(() => {
    // If not connected, connect
    if (!socket.connected) {
      socket.connect();
    }
    
    if (roomCode) {
      fetch(`${API_URL}/api/auth/me`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          const username = data.data?.user?.username || 'PLAYER';
          socket.emit('join_room', { roomCode, username });
        })
        .catch(() => {
          socket.emit('join_room', { roomCode, username: 'PLAYER' });
        });
    }
    
    const handleScoreUpdate = (data: any) => {
      setLeaderboard(data.leaderboard);
    };

    const handleMatchConcluded = (data: any) => {
      console.log("🔥 Payload received on frontend:", data);
      setLeaderboardData(data);
      setMatchEnded(true);
    };

    socket.on('score_update', handleScoreUpdate);
    socket.on('match_concluded', handleMatchConcluded);

    return () => {
      socket.off('score_update', handleScoreUpdate);
      socket.off('match_concluded', handleMatchConcluded);
    };
  }, []);

  useEffect(() => {
    if (gameState === 'playing' || gameState === 'revealed') {
      if (roomCode) {
        // Global match timer logic
        if (!globalTimerRef.current) {
          globalTimerRef.current = setInterval(() => {
            setGlobalMatchTimeLeft((prev) => {
              if (prev <= 1) {
                if (globalTimerRef.current) clearInterval(globalTimerRef.current);
                
                setMatchEnded((ended) => {
                  if (!ended) {
                    console.log("⏰ Timer hit zero. Triggering client-side failsafe state override...");
                    socket.emit('force_match_end', { roomCode });
                    return true;
                  }
                  return ended;
                });
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }
      } else {
        // Solo 30s timer
        setTimeLeft(30);
        setSelectedAnswers([]);
        
        timerRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              handleTimeUp();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } else if (gameState === 'waiting') {
      // Keep global timer running in waiting state
      if (!globalTimerRef.current && roomCode) {
        globalTimerRef.current = setInterval(() => {
          setGlobalMatchTimeLeft((prev) => {
            if (prev <= 1) {
              if (globalTimerRef.current) clearInterval(globalTimerRef.current);
              
              setMatchEnded((ended) => {
                if (!ended) {
                  console.log("⏰ Timer hit zero. Triggering client-side failsafe state override...");
                  socket.emit('force_match_end', { roomCode });
                  return true;
                }
                return ended;
              });
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }
    
    return () => {
      if (timerRef.current && !roomCode) clearInterval(timerRef.current);
    };
  }, [currentIdx, gameState, roomCode]);

  // Clean up global timer on unmount
  useEffect(() => {
    return () => {
      if (globalTimerRef.current) clearInterval(globalTimerRef.current);
    }
  }, []);

  const handleTimeUp = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameState('revealed');
  };

  const toggleSelection = (option: string, type: string) => {
    if (gameState !== 'playing') return;

    if (type === 'multiple_choice' || type === 'true_false') {
      // For this simple version, assume single correct answer for MCQ/TF
      setSelectedAnswers([option]);
    }
  };

  const handleSubmit = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameState('revealed');

    const currentQ = questions[currentIdx];
    // Simple verification (exact match for single answer)
    // For arrays, would need array intersection logic. We'll do simple include check.
    let isCorrect = false;
    if (currentQ.type === 'fill_blank') {
      const typedAns = selectedAnswers[0]?.toLowerCase().trim() || '';
      isCorrect = currentQ.correctAnswers.some(ans => ans.toLowerCase().trim() === typedAns);
    } else {
      isCorrect = selectedAnswers.every(ans => currentQ.correctAnswers.includes(ans)) 
                        && selectedAnswers.length === currentQ.correctAnswers.length;
    }
                      
    const newScore = isCorrect ? score + 1 : score;
    if (isCorrect) setScore(newScore);

    if (roomCode) {
      // Calculate current accuracy dynamically
      const questionsAnswered = currentIdx + 1;
      const accuracy = Math.round((newScore / questionsAnswered) * 100);
      socket.emit('submit_score', { roomCode, score: newScore, accuracy });
    }
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(c => c + 1);
      setGameState('playing');
      if (roomCode) {
        setSelectedAnswers([]);
      }
    } else {
      setTimeSpentMs(Date.now() - startTime);
      if (roomCode) {
        const accuracy = Math.round((score / questions.length) * 100);
        socket.emit('player_completed', { roomCode, score, accuracy });
        setGameState('waiting');
      } else {
        setGameState('finished');
      }
    }
  };

  if (gameState === 'loading') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center font-mono text-primary">
        <ShieldAlert size={64} className="animate-ping mb-4" />
        <h2 className="text-title-lg uppercase tracking-widest font-bold">Connecting to Module...</h2>
      </div>
    );
  }

  if (gameState === 'error') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center font-mono p-4 text-center">
        <div className="border border-error bg-error/10 text-error p-8 rounded max-w-md w-full">
          <h2 className="text-title-lg font-bold uppercase tracking-widest mb-4">Connection Failed</h2>
          <p className="mb-6 text-on-surface">{errorMsg}</p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary w-full font-bold">
            RETURN TO DASHBOARD
          </button>
        </div>
      </div>
    );
  }

  if (matchEnded && leaderboardData !== null) {
    return (
      <div className="p-8 bg-black text-white min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-3xl font-mono text-cyan-400 mb-6">⚡ MATCH CONCLUDED // FINAL RANKINGS</h1>
        <div className="w-full max-w-4xl border border-purple-500/30 p-6 bg-zinc-900/50 rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.1)]">
          <table className="w-full text-left font-mono">
            <thead>
              <tr className="border-b border-zinc-700 text-zinc-400">
                <th className="pb-3">RANK</th>
                <th className="pb-3">AGENT</th>
                <th className="pb-3">ACCURACY</th>
                <th className="pb-3">SCORE</th>
              </tr>
            </thead>
            <tbody>
              {leaderboardData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-red-500 font-bold animate-pulse tracking-widest">
                    NO DATA COLLECTED - ALL AGENTS TIMED OUT
                  </td>
                </tr>
              ) : (
                leaderboardData.map((player, idx) => (
                  <tr key={idx} className={`border-b border-zinc-800/50 ${idx === 0 ? 'text-purple-400 shadow-[glow]' : 'text-zinc-300'}`}>
                    <td className="py-3">#{idx + 1}</td>
                    <td className="py-3 font-bold">{player.username}</td>
                    <td className="py-3">{player.accuracy || '100'}%</td>
                    <td className="py-3 text-cyan-400">{player.score} pts</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-10 px-8 py-3 bg-transparent border border-cyan-400 text-cyan-400 font-mono font-bold tracking-[0.2em] uppercase hover:bg-cyan-400/10 hover:shadow-[0_0_20px_rgba(34,211,238,0.5)] transition-all duration-300 rounded-sm"
        >
          RETURN TO BASE
        </button>
      </div>
    );
  }

  if (gameState === 'finished') {
    return <QuizSummary quizId={quizId!} score={score} totalQuestions={questions.length} timeSpentMs={timeSpentMs} leaderboard={roomCode ? leaderboard : undefined} />;
  }

  if (gameState === 'waiting') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center font-mono p-4 text-center">
        <ShieldAlert size={64} className="text-secondary animate-pulse mb-6" />
        <h2 className="text-headline-sm font-bold text-on-surface mb-2 tracking-widest">
          ⚡ ALL MODULES COMPLETED // SECURING NETWORK NODE...
        </h2>
        <p className="text-secondary font-bold text-title-lg tracking-[0.2em] mb-4">
          MATCH CONCLUDES IN: {globalMatchTimeLeft}s
        </p>
        <p className="text-on-surface-variant uppercase tracking-widest text-sm animate-pulse">
          WAITING FOR OTHER AGENTS TO FINISH ANALYSIS...
        </p>
      </div>
    );
  }

  if (gameState === 'playing' && (!questions || questions.length === 0)) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center font-mono text-primary">
        <ShieldAlert size={64} className="animate-pulse mb-4" />
        <h2 className="text-title-lg uppercase tracking-widest font-bold">AWAITING QUESTIONS...</h2>
      </div>
    );
  }

  const question = questions[currentIdx];
  const progressPercent = ((currentIdx) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 font-mono">
      <div className={`max-w-6xl mx-auto grid grid-cols-1 ${roomCode ? 'md:grid-cols-3 gap-6' : 'md:grid-cols-1'}`}>
        
        {/* Quiz Area */}
        <div className={`transition-all duration-300 ${roomCode ? 'col-span-1 md:col-span-2' : 'col-span-1 md:col-span-3'}`}>
          <header className="mb-8 flex justify-between items-center bg-surface-container border border-primary/20 rounded p-4">
            <div>
              <h1 className="text-title-md font-bold text-on-surface uppercase tracking-widest line-clamp-1">{quiz?.title}</h1>
              <p className="text-xs text-primary mt-1 font-bold">MODULE PROGRESION</p>
            </div>
            {roomCode ? (
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs text-secondary font-bold uppercase tracking-widest">Global Timer</span>
                <div className="flex items-center gap-2 text-secondary font-bold text-title-md">
                  <Clock size={20} className={globalMatchTimeLeft <= 10 ? 'animate-ping text-error' : ''} />
                  <span className={globalMatchTimeLeft <= 10 ? 'text-error' : ''}>00:{globalMatchTimeLeft.toString().padStart(2, '0')}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-secondary font-bold text-title-lg">
                <Clock size={24} className={timeLeft <= 5 ? 'animate-ping text-error' : ''} />
                <span className={timeLeft <= 5 ? 'text-error' : ''}>00:{timeLeft.toString().padStart(2, '0')}</span>
              </div>
            )}
          </header>

          {/* Progress Bar */}
          <div className="bg-surface-container-high h-2 rounded-full mb-8 overflow-hidden">
            <div 
              className="bg-primary h-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(var(--primary-rgb),0.8)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="glass-card p-6 md:p-12 relative flex flex-col">
            <div className="flex justify-between items-center mb-8 border-b border-surface-container-high pb-4">
              <span className="text-body-md text-on-surface-variant uppercase tracking-widest font-bold">
                Question {currentIdx + 1} of {questions.length}
              </span>
              <span className="text-tertiary font-bold">SCORE: {score}</span>
            </div>

            <h2 className="text-headline-sm md:text-headline-md font-bold text-on-surface mb-8">
              {question.text}
            </h2>

            {question.mediaUrl && (
              <div className="mb-8 rounded overflow-hidden border border-primary/30 mx-auto max-w-lg">
                <img src={`${API_URL}${question.mediaUrl}`} alt="Question visual" className="w-full object-cover" />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
              {question.type !== 'fill_blank' && question.options.map((opt, idx) => {
                const isSelected = selectedAnswers.includes(opt);
                const isCorrect = question.correctAnswers.includes(opt);
                
                let btnClass = "bg-surface-container border border-surface-container-high text-on-surface hover:border-primary/50";
                let icon = null;

                if (gameState === 'revealed') {
                  if (isCorrect) {
                    btnClass = "bg-tertiary/20 border-tertiary text-tertiary shadow-[0_0_15px_rgba(var(--tertiary-rgb),0.3)]";
                    icon = <CheckCircle size={20} className="shrink-0" />;
                  } else if (isSelected && !isCorrect) {
                    btnClass = "bg-error/20 border-error text-error shadow-[0_0_15px_rgba(var(--error-rgb),0.3)]";
                    icon = <XCircle size={20} className="shrink-0" />;
                  } else {
                    btnClass = "bg-surface-container border-surface-container-high text-on-surface-variant opacity-50";
                  }
                } else if (isSelected) {
                  btnClass = "bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]";
                }

                return (
                  <button
                    key={idx}
                    disabled={gameState === 'revealed'}
                    onClick={() => toggleSelection(opt, question.type)}
                    className={`p-4 md:p-6 rounded text-left flex justify-between items-center transition-all duration-300 font-bold ${btnClass}`}
                  >
                    <span>{opt}</span>
                    {icon}
                  </button>
                );
              })}
            </div>

            {question.type === 'fill_blank' && (
              <div className="mb-12">
                <input
                  type="text"
                  value={selectedAnswers[0] || ''}
                  onChange={(e) => {
                    if (gameState === 'playing') setSelectedAnswers([e.target.value]);
                  }}
                  disabled={gameState === 'revealed'}
                  placeholder="Type your answer..."
                  className={`w-full p-4 md:p-6 rounded bg-surface-container border text-on-surface text-center text-title-md tracking-widest outline-none transition-all duration-300 font-bold ${
                    gameState === 'revealed'
                      ? question.correctAnswers.some(ans => ans.toLowerCase().trim() === (selectedAnswers[0] || '').toLowerCase().trim())
                        ? 'border-tertiary text-tertiary shadow-[0_0_15px_rgba(var(--tertiary-rgb),0.3)]'
                        : 'border-error text-error shadow-[0_0_15px_rgba(var(--error-rgb),0.3)]'
                      : 'border-primary focus:border-secondary focus:shadow-[0_0_15px_rgba(var(--secondary-rgb),0.3)]'
                  }`}
                />
                {gameState === 'revealed' && (
                  <div className="mt-4 text-center font-bold tracking-widest">
                    {question.correctAnswers.some(ans => ans.toLowerCase().trim() === (selectedAnswers[0] || '').toLowerCase().trim()) ? (
                      <span className="text-tertiary flex items-center justify-center gap-2"><CheckCircle size={24}/> CORRECT</span>
                    ) : (
                      <div className="text-error flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2"><XCircle size={24}/> INCORRECT</div>
                        <div className="text-on-surface-variant text-sm mt-2">Accepted answers: {question.correctAnswers.join(', ')}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Action Area */}
            <div className="pt-8 border-t border-surface-container-high flex justify-end">
              {gameState === 'playing' ? (
                <button
                  onClick={handleSubmit}
                  disabled={selectedAnswers.length === 0 && question.type !== 'fill_blank'}
                  className="btn-primary px-8 py-3 font-bold uppercase tracking-widest text-sm disabled:opacity-50"
                >
                  Submit Answer
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="bg-secondary text-on-secondary px-12 py-3 rounded uppercase font-bold tracking-widest text-sm shadow-[0_0_15px_rgba(var(--secondary-rgb),0.4)] hover:bg-secondary/90 transition-colors"
                >
                  {currentIdx < questions.length - 1 ? 'Next Question →' : 'Finish Quiz →'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Multiplayer Leaderboard Sidebar */}
        {roomCode && (
          <div className="col-span-1 glass-card p-6 h-fit sticky top-6 border-secondary/30">
            <h3 className="text-title-md font-bold text-on-surface mb-6 flex items-center gap-2 border-b border-surface-container-high pb-4">
              <Trophy className="text-secondary" />
              LIVE LEADERBOARD
            </h3>
            <div className="space-y-4">
              {leaderboard.length === 0 && (
                <p className="text-on-surface-variant text-sm text-center py-4">Waiting for updates...</p>
              )}
              {leaderboard.map((p, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 rounded bg-surface-container border border-surface-container-high relative overflow-hidden">
                  {idx === 0 && <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary shadow-[0_0_10px_rgba(var(--secondary-rgb),1)]"></div>}
                  <div className="flex items-center gap-3">
                    <span className={`font-bold ${idx === 0 ? 'text-secondary' : 'text-on-surface-variant'}`}>
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-on-surface truncate max-w-[100px]">{p.username}</span>
                  </div>
                  <span className="font-mono font-bold text-primary">{p.score} PT</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizPlayer;
