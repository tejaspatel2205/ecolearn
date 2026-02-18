const express = require('express');
const Notification = require('../models/Notification');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get my notifications
router.get('/', authMiddleware, async (req, res) => {
    try {
        const notifications = await Notification.find({ user_id: req.user._id })
            .sort({ created_at: -1 })
            .limit(20); // Limit to last 20 notifications
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mark notification as read
router.put('/:id/read', authMiddleware, async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, user_id: req.user._id },
            { is_read: true },
            { new: true }
        );
        res.json(notification);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mark all as read
router.put('/read-all', authMiddleware, async (req, res) => {
    try {
        await Notification.updateMany(
            { user_id: req.user._id, is_read: false },
            { is_read: true }
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
