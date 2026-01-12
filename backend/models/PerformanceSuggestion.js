const mongoose = require('mongoose');

const performanceSuggestionSchema = new mongoose.Schema({
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  weak_topic: {
    type: String,
    required: true
  },
  suggestion_text: {
    type: String,
    required: true
  },
  recommended_lessons: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Lesson',
    default: []
  },
  recommended_quizzes: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Quiz',
    default: []
  },
  generated_at: {
    type: Date,
    default: Date.now
  },
  is_viewed: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('PerformanceSuggestion', performanceSuggestionSchema);

