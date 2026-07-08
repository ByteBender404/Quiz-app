const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Quiz',
      required: [true, 'A question must belong to a quiz'],
      index: true,
    },
    text: {
      type: String,
      required: [true, 'A question must have text'],
    },
    type: {
      type: String,
      enum: ['multiple_choice', 'true_false', 'fill_blank'],
      required: [true, 'A question must have a type'],
    },
    options: {
      type: [String],
      // Required for multiple choice, optional otherwise
    },
    correctAnswers: {
      type: [String],
      required: [true, 'A question must have at least one correct answer'],
    },
    mediaUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Question = mongoose.model('Question', questionSchema);
module.exports = Question;
