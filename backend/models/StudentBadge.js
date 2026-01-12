const mongoose = require('mongoose');

const studentBadgeSchema = new mongoose.Schema({
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  badge_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Badge',
    required: true
  },
  earned_at: {
    type: Date,
    default: Date.now
  }
});

// Ensure unique badge per student
studentBadgeSchema.index({ student_id: 1, badge_id: 1 }, { unique: true });

module.exports = mongoose.model('StudentBadge', studentBadgeSchema);

