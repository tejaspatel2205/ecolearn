const mongoose = require('mongoose');

const institutionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['school', 'college', 'university', 'ngo'],
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
  },
  colleges: {
    type: [String], // List of colleges under this university
    default: []
  }
});

institutionSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Institution', institutionSchema);

