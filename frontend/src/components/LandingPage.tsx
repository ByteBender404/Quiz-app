import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Zap, Terminal } from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col items-center justify-center p-6 font-mono relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-secondary/10 rounded-full blur-[150px] pointer-events-none -z-10" />

      {/* Main Content */}
      <div className="max-w-3xl w-full text-center z-10 flex flex-col items-center">
        
        <div className="mb-6 animate-pulse">
          <Terminal size={64} className="text-secondary" />
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-[0.2em] mb-6 text-on-surface drop-shadow-[0_0_20px_rgba(var(--secondary-rgb),0.5)] uppercase">
          NEURAL NET <br className="md:hidden" /> <span className="text-secondary shadow-[glow]">QUIZ ARENA</span>
        </h1>
        
        <p className="text-title-lg md:text-headline-sm text-on-surface-variant mb-12 max-w-2xl leading-relaxed tracking-widest">
          Infiltrate the mainframe. Compete in real-time against other agents. Prove your cognitive processing speed.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 w-full max-w-md mx-auto sm:max-w-none sm:justify-center">
          <button
            onClick={() => navigate('/login')}
            className="group relative flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-4 bg-secondary/10 border border-secondary text-secondary font-bold tracking-[0.2em] uppercase hover:bg-secondary/20 hover:shadow-[0_0_20px_rgba(var(--secondary-rgb),0.6)] transition-all duration-300 rounded-sm overflow-hidden"
          >
            <Shield className="w-5 h-5 transition-transform group-hover:scale-110" />
            <span className="relative z-10">INITIALIZE LOGIN</span>
            <div className="absolute inset-0 bg-secondary/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          </button>

          <button
            onClick={() => navigate('/signup')}
            className="group relative flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-4 bg-transparent border border-tertiary text-tertiary font-bold tracking-[0.2em] uppercase hover:bg-tertiary/10 hover:shadow-[0_0_20px_rgba(var(--tertiary-rgb),0.6)] transition-all duration-300 rounded-sm overflow-hidden"
          >
            <Zap className="w-5 h-5 transition-transform group-hover:scale-110" />
            <span className="relative z-10">REGISTER NEW AGENT</span>
            <div className="absolute inset-0 bg-tertiary/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          </button>
        </div>
        
        {/* Terminal decorative text */}
        <div className="mt-20 font-mono text-label-md text-on-surface-variant/50 flex flex-col items-center gap-2">
          <p>STATUS: ONLINE</p>
          <p>ENCRYPTION: 256-BIT NEURAL</p>
          <p>AWAITING OPERATOR INPUT_</p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
