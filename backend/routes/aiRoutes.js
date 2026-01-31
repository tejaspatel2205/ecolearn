const express = require('express');
const router = express.Router();
const { askAI, gradeEssay } = require('../controllers/aiController');
const { authMiddleware } = require('../middleware/auth');

// Use auth middleware to protect AI routes
router.post('/ask', authMiddleware, askAI);
router.post('/grade', authMiddleware, gradeEssay);

module.exports = router;
