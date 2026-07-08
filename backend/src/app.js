const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const errorHandler = require('./middlewares/errorHandler');
const authRoutes = require('./modules/auth/auth.routes');
const quizRoutes = require('./modules/quizzes/quiz.routes');

const app = express();

app.use(cors({
  origin: 'http://localhost:5173', // Or your frontend URL
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Serve static files from the public folder
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/v1/quizzes', quizRoutes);

// Global Error Handler
app.use(errorHandler);

module.exports = app;
