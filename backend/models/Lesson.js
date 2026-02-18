const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  content: {
    type: String,
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  teacher_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  class_number: {
    type: String,
    default: null
  },
  order_index: {
    type: Number,
    default: 0
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  admin_feedback: {
    type: String,
    default: ''
  }
});

lessonSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Lesson', lessonSchema);

