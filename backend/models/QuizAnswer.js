const mongoose = require('mongoose');

const quizAnswerSchema = new mongoose.Schema({
  attempt_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuizAttempt',
    required: true
  },
  question_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuizQuestion',
    required: true
  },
  student_answer: {
    type: String,
    default: ''
  },
  is_correct: {
    type: Boolean,
    default: false
  },
  marks_obtained: {
    type: Number,
    default: 0
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('QuizAnswer', quizAnswerSchema);

