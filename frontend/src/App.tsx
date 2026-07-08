import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SignUp from './components/SignUp';
import Login from './components/Login';
import QuizCreator from './components/QuizCreator';
import Dashboard from './components/Dashboard';
import QuizPlayer from './components/QuizPlayer';
import MultiplayerLobby from './components/MultiplayerLobby';
import LandingPage from './components/LandingPage';

const App: React.FC = () => {
  const isAuthenticated = !!localStorage.getItem('userId');

  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/create-quiz" element={<QuizCreator />} />
        <Route path="/quiz/:quizId" element={<QuizPlayer />} />
        <Route path="/multiplayer" element={<MultiplayerLobby />} />
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
      </Routes>
    </Router>
  );
};

export default App;
