const mongoose = require('mongoose');

const quizQuestionSchema = new mongoose.Schema({
  quiz_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  question_text: {
    type: String,
    required: true
  },
  question_type: {
    type: String,
    enum: ['multiple_choice', 'true_false', 'short_answer'],
    default: 'multiple_choice'
  },
  options: {
    type: Map,
    of: String,
    default: {}
  },
  correct_answer: {
    type: String,
    required: true
  },
  marks: {
    type: Number,
    default: 1
  },
  order_index: {
    type: Number,
    default: 0
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('QuizQuestion', quizQuestionSchema);

