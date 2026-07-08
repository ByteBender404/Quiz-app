const mongoose = require('mongoose');

const historySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'History must belong to a user'],
      index: true,
    },
    quiz: {
      type: mongoose.Schema.ObjectId,
      ref: 'Quiz',
      required: [true, 'History must belong to a quiz'],
      index: true,
    },
    score: {
      type: Number,
      required: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    timeSpentMs: {
      type: Number,
      required: true,
    },
    isWin: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const History = mongoose.model('History', historySchema);
module.exports = History;
