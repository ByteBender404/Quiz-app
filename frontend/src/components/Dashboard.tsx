import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { Trophy, Activity, Target, Plus, Users, Search, Trash2 } from 'lucide-react';

interface Quiz {
  _id: string;
  title: string;
  category: string;
  description: string;
  creator: string;
}

const Dashboard: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState({ totalQuizzesPlayed: 0, quizzesWon: 0 });
  const [username, setUsername] = useState('PLAYER');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [quizRes, userRes] = await Promise.all([
          fetch(`${API_URL}/api/v1/quizzes`, { credentials: 'include' }),
          fetch(`${API_URL}/api/auth/me`, { credentials: 'include' })
        ]);

        if (quizRes.ok) {
          const quizData = await quizRes.json();
          if (quizData.success && quizData.data?.quizzes) {
            setQuizzes(quizData.data.quizzes);
          }
        }

        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.success && userData.data?.user) {
            setUsername(userData.data.user.username);
            if (userData.data.user.stats) {
              setUserStats(userData.data.user.stats);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleDeleteQuiz = async (quizId: string) => {
    if (!window.confirm('Are you sure you want to delete this quiz?')) return;

    try {
      const response = await fetch(`${API_URL}/api/v1/quizzes/${quizId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        setQuizzes((prev) => prev.filter((q) => q._id !== quizId));
      } else {
        console.error('Failed to delete quiz');
      }
    } catch (err) {
      console.error('Error deleting quiz:', err);
    }
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('userId');
      await fetch(`${API_URL}/api/auth/logout`, { 
        method: 'GET', 
        credentials: 'include' 
      });
      window.location.href = '/';
    } catch (err) {
      console.error('Logout failed:', err);
      window.location.href = '/';
    }
  };

  const winRate = userStats.totalQuizzesPlayed > 0 
    ? Math.round((userStats.quizzesWon / userStats.totalQuizzesPlayed) * 100) 
    : 0;

  const xp = (userStats.totalQuizzesPlayed * 100) + (userStats.quizzesWon * 150);
  let rankTier = "NOVICE TIER";
  if (xp >= 2000) rankTier = "DIAMOND TIER";
  else if (xp >= 1000) rankTier = "GOLD TIER";
  else if (xp >= 500) rankTier = "SILVER TIER";

  return (
    <div className="min-h-screen bg-background p-6 md:p-12 font-mono">
      <div className="max-w-6xl mx-auto space-y-12">

        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-primary/20 pb-6">
          <div>
            <h1 className="text-headline-lg font-bold text-on-surface mb-2 tracking-tight">
              DASHBOARD_
            </h1>
            <p className="text-body-md text-on-surface-variant uppercase tracking-widest text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              STATUS: ONLINE // WELCOME BACK, {username.toUpperCase()}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-bold tracking-widest text-error border border-error bg-transparent uppercase hover:bg-error/10 hover:shadow-[0_0_15px_rgba(255,84,73,0.5)] transition-all duration-300 rounded-sm"
            >
              TERMINATE SESSION
            </button>
            <div className="w-12 h-12 rounded-full bg-surface-container border border-primary/30 flex items-center justify-center text-primary font-bold uppercase">
              {username.slice(0, 2)}
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-primary group-hover:scale-110 transition-transform">
              <Target size={64} />
            </div>
            <p className="text-label-sm text-on-surface-variant mb-2">TOTAL QUIZZES PLAYED</p>
            <h2 className="text-headline-md font-bold text-on-surface">{userStats.totalQuizzesPlayed}</h2>
            <p className="text-xs text-primary mt-2 flex items-center gap-1 font-bold uppercase">
              <span className="w-1 h-1 rounded-full bg-primary"></span>
              {quizzes.length} MODULES DETECTED
            </p>
          </div>
          <div className="glass-card relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-secondary group-hover:scale-110 transition-transform">
              <Activity size={64} />
            </div>
            <p className="text-label-sm text-on-surface-variant mb-2">WIN RATE</p>
            <h2 className="text-headline-md font-bold text-on-surface">
              {winRate}%
            </h2>
            <p className="text-xs text-secondary mt-2 flex items-center gap-1 font-bold uppercase">
              <span className="w-1 h-1 rounded-full bg-secondary"></span>
              {winRate >= 80 ? 'ELITE ACCURACY' : winRate >= 50 ? 'COMPETENT' : 'TRAINING REQUIRED'}
            </p>
          </div>
          <div className="glass-card relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-tertiary group-hover:scale-110 transition-transform">
              <Trophy size={64} />
            </div>
            <p className="text-label-sm text-on-surface-variant mb-2">PLAYER XP</p>
            <h2 className="text-headline-md font-bold text-on-surface">{xp.toLocaleString()}</h2>
            <p className="text-xs text-tertiary mt-2 flex items-center gap-1 font-bold uppercase">
              <span className="w-1 h-1 rounded-full bg-tertiary"></span>
              {rankTier}
            </p>
          </div>
        </div>

        {/* Primary Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link to="/create-quiz" className="block">
            <div className="glass-card h-full bg-gradient-to-br from-surface-container to-primary/10 border-primary/30 hover:border-primary transition-colors cursor-pointer group flex flex-col justify-center items-center text-center p-8">
              <div className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Plus size={32} />
              </div>
              <h3 className="text-title-lg font-bold text-on-surface mb-2">CREATE A QUIZ</h3>
              <p className="text-body-sm text-on-surface-variant">Initialize a new assessment module and challenge the network.</p>
            </div>
          </Link>

          <Link to="/multiplayer" className="block">
            <div className="glass-card h-full bg-gradient-to-br from-surface-container to-secondary/10 border-secondary/30 hover:border-secondary transition-colors cursor-pointer group flex flex-col justify-center items-center text-center p-8">
              <div className="w-16 h-16 rounded-full bg-secondary/20 text-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Users size={32} />
              </div>
              <h3 className="text-title-lg font-bold text-on-surface mb-2">⚡ ENTER MULTIPLAYER ARENA</h3>
              <p className="text-body-sm text-on-surface-variant">Create or join a synchronized live assessment lobby.</p>
            </div>
          </Link>
        </div>

        {/* Quizzes List */}
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-surface-container-high pb-4">
            <h2 className="text-title-lg font-bold text-on-surface flex items-center gap-2">
              <Search size={24} className="text-primary" />
              AVAILABLE MODULES
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-12 text-on-surface-variant animate-pulse">
              LOADING MODULES...
            </div>
          ) : quizzes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map((quiz) => (
                <div key={quiz._id} className="glass-card flex flex-col h-full hover:border-primary/50 transition-colors">
                  <div className="mb-4 relative">
                    <button
                      onClick={() => handleDeleteQuiz(quiz._id)}
                      className="absolute top-0 right-0 text-on-surface-variant hover:text-error transition-colors p-1"
                      title="Delete Quiz"
                    >
                      <Trash2 size={18} />
                    </button>
                    <span className="inline-block px-2 py-1 bg-surface-container-high text-xs font-bold text-primary rounded mb-2">
                      {quiz.category || 'GENERAL'}
                    </span>
                    <h3 className="text-title-md font-bold text-on-surface line-clamp-1">{quiz.title}</h3>
                    <p className="text-body-sm text-on-surface-variant mt-2 line-clamp-2">
                      {quiz.description || 'No description provided.'}
                    </p>
                  </div>
                  <div className="mt-auto pt-4 border-t border-surface-container-high flex justify-between items-center">
                    <span className="text-xs font-bold text-tertiary uppercase">HARD</span>
                    <Link to={`/quiz/${quiz._id}`} className="text-secondary text-sm font-bold uppercase hover:text-secondary-fixed transition-colors">
                      START →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card text-center py-12 border-dashed">
              <p className="text-on-surface-variant mb-4">No modules found in the database.</p>
              <Link to="/create-quiz" className="btn-primary inline-block font-bold">
                Create the First Module
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
