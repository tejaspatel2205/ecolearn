const mongoose = require('mongoose');

const classEnrollmentSchema = new mongoose.Schema({
  class_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  enrolled_at: {
    type: Date,
    default: Date.now
  }
});

// Ensure unique enrollment
classEnrollmentSchema.index({ class_id: 1, student_id: 1 }, { unique: true });

module.exports = mongoose.model('ClassEnrollment', classEnrollmentSchema);

