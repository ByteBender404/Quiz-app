import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Clock, Target, Activity } from 'lucide-react';
import { API_URL } from '../config';

interface QuizSummaryProps {
  quizId: string;
  score: number;
  totalQuestions: number;
  timeSpentMs: number;
  leaderboard?: { username: string; score: number; accuracy?: number }[];
}

const QuizSummary: React.FC<QuizSummaryProps> = ({ quizId, score, totalQuestions, timeSpentMs, leaderboard }) => {
  const [isSubmitting, setIsSubmitting] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const submitScore = async () => {
      try {
        const response = await fetch(`${API_URL}/api/v1/quizzes/${quizId}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ score, totalQuestions, timeSpentMs }),
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error('Failed to submit score');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsSubmitting(false);
      }
    };
    submitScore();
  }, [quizId, score, totalQuestions, timeSpentMs]);

  const accuracy = Math.round((score / totalQuestions) * 100) || 0;
  const isWin = accuracy >= 70;
  const minutes = Math.floor(timeSpentMs / 60000);
  const seconds = Math.floor((timeSpentMs % 60000) / 1000);

  return (
    <div className="min-h-screen bg-background p-6 md:p-12 font-mono flex items-center justify-center">
      <div className="max-w-2xl w-full">
        <div className={`glass-card p-12 text-center relative overflow-hidden border ${isWin ? 'border-tertiary' : 'border-error'}`}>
          <div className={`absolute top-0 left-0 w-full h-1 ${isWin ? 'bg-tertiary shadow-[0_0_15px_rgba(var(--tertiary-rgb),0.8)]' : 'bg-error'} animate-pulse`}></div>
          
          <div className="mb-8 relative inline-block">
            <Trophy size={80} className={`mx-auto ${isWin ? 'text-tertiary drop-shadow-[0_0_15px_rgba(var(--tertiary-rgb),0.8)]' : 'text-on-surface-variant'}`} />
            {isWin && (
              <div className="absolute inset-0 animate-ping opacity-20 bg-tertiary rounded-full"></div>
            )}
          </div>
          
          <h1 className="text-headline-lg font-bold text-on-surface mb-2 tracking-widest uppercase">
            {isWin ? 'MISSION ACCOMPLISHED' : 'MISSION FAILED'}
          </h1>
          <p className="text-body-lg text-on-surface-variant mb-12 uppercase tracking-widest">
            {isWin ? 'Outstanding cognitive performance.' : 'Insufficient accuracy threshold.'}
          </p>

          {isSubmitting ? (
            <div className="text-primary animate-pulse my-8 uppercase tracking-widest font-bold">
              Transmitting telemetry data...
            </div>
          ) : error ? (
            <div className="text-error mb-8 p-4 bg-error/10 border border-error/30 rounded">
              Telemetry Error: {error}
            </div>
          ) : leaderboard && leaderboard.length > 0 ? (
            <div className="mb-12">
              <h3 className="text-title-md font-bold text-on-surface mb-6 uppercase tracking-widest border-b border-surface-container-high pb-4">
                GLOBAL MATCH LEADERBOARD
              </h3>
              <div className="bg-surface-container border border-surface-container-high rounded overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-surface-container-high text-on-surface-variant text-label-sm uppercase tracking-widest">
                    <tr>
                      <th className="p-4">Rank</th>
                      <th className="p-4">Operator</th>
                      <th className="p-4 text-center">Accuracy</th>
                      <th className="p-4 text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((player, idx) => {
                      const isTop = idx === 0;
                      return (
                        <tr key={idx} className={`border-b border-surface-container-high last:border-b-0 ${isTop ? 'bg-secondary/10 relative' : ''}`}>
                          <td className={`p-4 font-bold ${isTop ? 'text-secondary shadow-[inset_4px_0_0_rgba(var(--secondary-rgb),1)]' : 'text-on-surface-variant'}`}>
                            #{idx + 1}
                          </td>
                          <td className={`p-4 font-bold ${isTop ? 'text-on-surface drop-shadow-[0_0_10px_rgba(var(--secondary-rgb),0.8)]' : 'text-on-surface'}`}>
                            {player.username}
                          </td>
                          <td className={`p-4 text-center font-mono font-bold ${isTop ? 'text-secondary' : 'text-on-surface-variant'}`}>
                            {player.accuracy !== undefined ? `${player.accuracy}%` : '--'}
                          </td>
                          <td className={`p-4 text-right font-mono font-bold ${isTop ? 'text-secondary drop-shadow-[0_0_10px_rgba(var(--secondary-rgb),0.8)]' : 'text-primary'}`}>
                            {player.score} PT
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-surface-container rounded p-6 border border-primary/20">
                <Target size={24} className="text-primary mx-auto mb-2" />
                <p className="text-label-sm text-on-surface-variant mb-1 uppercase tracking-wider">Final Score</p>
                <p className="text-title-lg font-bold text-on-surface">{score} / {totalQuestions}</p>
              </div>
              <div className="bg-surface-container rounded p-6 border border-secondary/20">
                <Activity size={24} className="text-secondary mx-auto mb-2" />
                <p className="text-label-sm text-on-surface-variant mb-1 uppercase tracking-wider">Accuracy</p>
                <p className="text-title-lg font-bold text-on-surface">{accuracy}%</p>
              </div>
              <div className="bg-surface-container rounded p-6 border border-tertiary/20">
                <Clock size={24} className="text-tertiary mx-auto mb-2" />
                <p className="text-label-sm text-on-surface-variant mb-1 uppercase tracking-wider">Time</p>
                <p className="text-title-lg font-bold text-on-surface">{minutes}m {seconds}s</p>
              </div>
            </div>
          )}

          <Link to="/dashboard" className="btn-primary inline-flex items-center gap-2 font-bold uppercase tracking-widest text-lg px-12 py-4">
            RETURN TO DASHBOARD
          </Link>
        </div>
      </div>
    </div>
  );
};

export default QuizSummary;
