const Quiz = require('./quiz.model');
const Question = require('./question.model');
const History = require('./history.model');
const User = require('../user/user.model');
const { GoogleGenAI, Type } = require('@google/genai');

exports.createQuiz = async (req, res, next) => {
  const newQuiz = await Quiz.create({
    ...req.body,
    creator: req.user.id,
  });

  res.status(201).json({
    success: true,
    data: {
      quiz: newQuiz,
    },
  });
};

exports.getQuizzes = async (req, res, next) => {
  const { page = 1, limit = 10, category, search } = req.query;

  // Build query
  const queryObj = {};

  if (category) {
    queryObj.category = category;
  }

  if (search) {
    queryObj.$text = { $search: search };
  }

  // Execute query with pagination
  const quizzes = await Quiz.find(queryObj)
    .skip((page - 1) * limit)
    .limit(limit * 1)
    .populate('creator', 'username email');

  const total = await Quiz.countDocuments(queryObj);

  res.status(200).json({
    success: true,
    results: quizzes.length,
    totalPages: Math.ceil(total / limit),
    currentPage: Number(page),
    data: {
      quizzes,
    },
  });
};

exports.addQuestion = async (req, res, next) => {
  const quizId = req.params.quizId;

  // Verify quiz exists and user is owner
  const quiz = await Quiz.findById(quizId);
  if (!quiz) {
    const error = new Error('No quiz found with that ID');
    error.statusCode = 404;
    return next(error);
  }

  if (quiz.creator.toString() !== req.user.id && req.user.role !== 'admin') {
    const error = new Error('You do not have permission to add questions to this quiz');
    error.statusCode = 403;
    return next(error);
  }

  // Handle media URL from multer
  let mediaUrl = '';
  if (req.file) {
    mediaUrl = `/uploads/${req.file.filename}`;
  }

  // Parse correctAnswers and options from form data (might be sent as JSON strings or arrays)
  let { correctAnswers, options } = req.body;
  if (typeof correctAnswers === 'string') {
    try { correctAnswers = JSON.parse(correctAnswers); } catch(e) { correctAnswers = [correctAnswers]; }
  }
  if (typeof options === 'string') {
    try { options = JSON.parse(options); } catch(e) { options = [options]; }
  }

  const newQuestion = await Question.create({
    ...req.body,
    options: options,
    correctAnswers: correctAnswers,
    quizId,
    mediaUrl,
  });

  res.status(201).json({
    success: true,
    data: {
      question: newQuestion,
    },
  });
};

exports.deleteQuiz = async (req, res, next) => {
  const quiz = await Quiz.findById(req.params.id);

  if (!quiz) {
    const error = new Error('No quiz found with that ID');
    error.statusCode = 404;
    return next(error);
  }

  if (quiz.creator.toString() !== req.user.id && req.user.role !== 'admin') {
    const error = new Error('You do not have permission to delete this quiz');
    error.statusCode = 403;
    return next(error);
  }

  await quiz.deleteOne();
  
  // Cascade delete questions
  await Question.deleteMany({ quizId: quiz._id });

  res.status(204).json({
    success: true,
    data: null,
  });
};

exports.generateAIQuiz = async (req, res, next) => {
  const { topic, difficulty, numQuestions } = req.body;
  
  if (!topic || !difficulty || !numQuestions) {
    const error = new Error('Please provide topic, difficulty, and numQuestions');
    error.statusCode = 400;
    return next(error);
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const prompt = `Act as an expert quiz creator. Generate a ${difficulty} difficulty quiz about "${topic}" with exactly ${numQuestions} questions. Make the questions engaging and accurate. Each question must have a 'text', 'type' (either 'multiple_choice' or 'true_false'), an array of 'options', and an array of 'correctAnswers' containing the exact string of the correct option. For true_false questions, options should be exactly ["True", "False"].`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          category: { type: Type.STRING },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                type: { type: Type.STRING, enum: ["multiple_choice", "true_false"] },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswers: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["text", "type", "options", "correctAnswers"]
            }
          }
        },
        required: ["title", "description", "category", "questions"]
      }
    }
  });

  const generatedData = JSON.parse(response.text);

  // Save the Quiz to MongoDB
  const newQuiz = await Quiz.create({
    title: generatedData.title,
    description: generatedData.description,
    category: generatedData.category,
    creator: req.user.id,
  });

  // Prepare and save all Questions to MongoDB
  const questionDocs = generatedData.questions.map((q) => ({
    quizId: newQuiz._id,
    text: q.text,
    type: q.type,
    options: q.options,
    correctAnswers: q.correctAnswers,
  }));

  if (questionDocs.length > 0) {
    await Question.insertMany(questionDocs);
  }

  res.status(201).json({
    success: true,
    data: {
      quiz: newQuiz,
      questionsCount: questionDocs.length
    }
  });
};

exports.getQuiz = async (req, res, next) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) {
    const error = new Error('No quiz found with that ID');
    error.statusCode = 404;
    return next(error);
  }

  const questions = await Question.find({ quizId: quiz._id });

  res.status(200).json({
    success: true,
    data: {
      quiz,
      questions,
    },
  });
};

exports.submitQuiz = async (req, res, next) => {
  const { score, totalQuestions, timeSpentMs } = req.body;
  const userId = req.user.id;
  const quizId = req.params.id;

  if (score === undefined || !totalQuestions || !timeSpentMs) {
    const error = new Error('Please provide score, totalQuestions, and timeSpentMs');
    error.statusCode = 400;
    return next(error);
  }

  const isWin = (score / totalQuestions) >= 0.70;

  const history = await History.create({
    user: userId,
    quiz: quizId,
    score,
    totalQuestions,
    timeSpentMs,
    isWin
  });

  const incUpdate = {
    'stats.totalQuizzesPlayed': 1
  };
  
  if (isWin) {
    incUpdate['stats.quizzesWon'] = 1;
  }

  await User.findByIdAndUpdate(userId, { $inc: incUpdate });

  res.status(201).json({
    success: true,
    data: {
      history,
    },
  });
};
