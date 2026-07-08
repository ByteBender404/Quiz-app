const express = require('express');
const quizController = require('./quiz.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'public/uploads';
    // Ensure directory exists
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

router
  .route('/')
  .get(quizController.getQuizzes)
  .post(authMiddleware.protect, quizController.createQuiz);

router
  .route('/generate-ai')
  .post(authMiddleware.protect, quizController.generateAIQuiz);

router
  .route('/:id')
  .get(authMiddleware.protect, quizController.getQuiz)
  .delete(authMiddleware.protect, quizController.deleteQuiz);

router
  .route('/:id/submit')
  .post(authMiddleware.protect, quizController.submitQuiz);

router
  .route('/:quizId/questions')
  .post(authMiddleware.protect, upload.single('media'), quizController.addQuestion);

module.exports = router;
