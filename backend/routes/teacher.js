const express = require('express');
const Class = require('../models/Class');
const ClassEnrollment = require('../models/ClassEnrollment');
const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get teacher stats
router.get('/stats', authMiddleware, roleMiddleware('teacher'), async (req, res) => {
  try {
    const User = require('../models/User');
    
    // Get all students (since enrollment system might not be fully implemented)
    const allStudents = await User.find({ role: 'student' });
    
    const classes = await Class.find({ teacher_id: req.user._id });
    const classIds = classes.map(c => c._id);
    
    const enrollments = await ClassEnrollment.find({ class_id: { $in: classIds } });
    const lessons = await Lesson.find({ teacher_id: req.user._id });
    const quizzes = await Quiz.find({ teacher_id: req.user._id });

    res.json({
      totalStudents: allStudents.length, // Show all students for now
      totalLessons: lessons.length,
      totalQuizzes: quizzes.length,
      totalClasses: classes.length,
      avgQuizScore: 0 // Mock data for now
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get class students
router.get('/classes/:classId/students', authMiddleware, roleMiddleware('teacher'), async (req, res) => {
  try {
    const enrollments = await ClassEnrollment.find({ class_id: req.params.classId })
      .populate('student_id', 'full_name email');
    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get quiz results
router.get('/quiz-results', authMiddleware, roleMiddleware('teacher'), async (req, res) => {
  try {
    const QuizAttempt = require('../models/QuizAttempt');
    const attempts = await QuizAttempt.find()
      .populate({
        path: 'quiz_id',
        match: { teacher_id: req.user._id },
        select: 'title'
      })
      .populate('student_id', 'full_name email')
      .sort({ completed_at: -1 });
    
    // Filter out attempts where quiz_id is null (not teacher's quiz)
    const teacherAttempts = attempts.filter(attempt => attempt.quiz_id);
    res.json(teacherAttempts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get challenge submissions
router.get('/challenge-results', authMiddleware, roleMiddleware('teacher'), async (req, res) => {
  try {
    const ChallengeSubmission = require('../models/ChallengeSubmission');
    const submissions = await ChallengeSubmission.find()
      .populate({
        path: 'challenge_id',
        match: { teacher_id: req.user._id },
        select: 'title'
      })
      .populate('student_id', 'full_name email')
      .sort({ submitted_at: -1 });
    
    // Filter out submissions where challenge_id is null (not teacher's challenge)
    const teacherSubmissions = submissions.filter(submission => submission.challenge_id);
    res.json(teacherSubmissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

