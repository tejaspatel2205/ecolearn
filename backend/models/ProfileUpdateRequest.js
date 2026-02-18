const mongoose = require('mongoose');

const profileUpdateRequestSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    requested_changes: {
        type: Object, // Store the fields to be updated
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    admin_feedback: {
        type: String,
        default: ''
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    reviewed_at: {
        type: Date
    },
    reviewed_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

module.exports = mongoose.model('ProfileUpdateRequest', profileUpdateRequestSchema);
