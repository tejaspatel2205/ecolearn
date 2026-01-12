const mongoose = require('mongoose');

const institutionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['school', 'college', 'ngo'],
    required: true
  },
  address: {
    type: String,
    default: ''
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

institutionSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Institution', institutionSchema);

