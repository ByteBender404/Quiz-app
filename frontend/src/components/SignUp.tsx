import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password }),
        credentials: 'include',
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Signup failed');
      
      console.log('Signup successful', data);
      localStorage.setItem('userId', data.data.user._id);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background glow effects */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/10 blur-[120px] rounded-full mix-blend-screen"></div>
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-primary-container/10 blur-[120px] rounded-full mix-blend-screen"></div>
      </div>

      <div className="glass-card w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-headline-lg font-bold mb-2">CREATE ACCOUNT</h1>
          <p className="text-body-md text-on-surface-variant font-mono uppercase tracking-widest text-xs">
            Join the Cyber-Athletic Network
          </p>
        </div>

        {error && <div className="mb-4 p-3 bg-error-container text-on-error-container rounded text-sm text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="text-label-sm block text-on-surface">EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="player@network.com"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-label-sm block text-on-surface">USERNAME</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field font-mono"
              placeholder="PLAYER_ONE"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-label-sm block text-on-surface">PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="w-full btn-primary font-bold uppercase tracking-wider mt-4">
            {loading ? 'INITIALIZING...' : 'Initialize Profile'}
          </button>
        </form>

        <div className="mt-8 text-center text-label-md text-on-surface-variant">
          ALREADY A MEMBER?{' '}
          <Link to="/login" className="text-secondary hover:text-secondary-fixed transition-colors">
            AUTHENTICATE HERE
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
