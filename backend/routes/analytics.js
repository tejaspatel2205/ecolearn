const express = require('express');
const QuizAttempt = require('../models/QuizAttempt');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get global analytics
router.get('/global', authMiddleware, async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ status: 'completed' });
    const avgScore = attempts.length > 0
      ? attempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / attempts.length
      : 0;

    res.json({
      totalAttempts: attempts.length,
      avgQuizScore: avgScore.toFixed(2)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

