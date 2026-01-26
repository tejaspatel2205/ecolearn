const express = require('express');
const User = require('../models/User');
const Institution = require('../models/Institution');
const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');
const Challenge = require('../models/Challenge');
const StudentStats = require('../models/StudentStats');
const InternalAssessment = require('../models/InternalAssessment');
const RetakeRequest = require('../models/RetakeRequest');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get admin stats
router.get('/stats', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const users = await User.find();
    const institutions = await Institution.find();
    const lessons = await Lesson.find();
    const quizzes = await Quiz.find();

    const students = users.filter(u => u.role === 'student').length;
    const teachers = users.filter(u => u.role === 'teacher').length;
    const admins = users.filter(u => u.role === 'admin').length;

    res.json({
      totalUsers: users.length,
      totalStudents: students,
      totalTeachers: teachers,
      totalAdmins: admins,
      totalInstitutions: institutions.length,
      totalLessons: lessons.length,
      totalQuizzes: quizzes.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Get Exam Planner Stats
router.get('/exam-planner-stats', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    // 1. Completion Rate: % of students who have at least one internal assessment
    const totalStudents = await User.countDocuments({ role: 'student' });
    const studentsWithAssessments = await InternalAssessment.distinct('student_id');
    const completionRate = totalStudents > 0
      ? Math.round((studentsWithAssessments.length / totalStudents) * 100)
      : 0;

    // 2. Average Internal Score (Global)
    const allAssessments = await InternalAssessment.find();
    let totalPercentage = 0;
    let count = 0;

    allAssessments.forEach(ass => {
      if (ass.total_internal_marks > 0) {
        totalPercentage += (ass.internal_marks_obtained / ass.total_internal_marks) * 100;
        count++;
      }
    });

    const avgInternalScore = count > 0 ? (totalPercentage / count).toFixed(1) : 0;

    // 3. Pending Reviews (Retake requests)
    const pendingAssessments = await RetakeRequest.countDocuments({ status: 'pending' });

    // 4. Active Policies (Static for now, implies NEP 2020 compliance check)
    const activePolicies = 4;

    res.json({
      completionRate: `${completionRate}%`,
      avgInternalScore: `${avgInternalScore}%`,
      pendingAssessments,
      activePolicies
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all users
router.get('/users', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user role
router.put('/users/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user
router.delete('/users/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get analytics data
router.get('/analytics', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const users = await User.find();
    const institutions = await Institution.find();
    const lessons = await Lesson.find();
    const quizzes = await Quiz.find();
    const challenges = await Challenge.find();

    const students = users.filter(u => u.role === 'student').length;
    const teachers = users.filter(u => u.role === 'teacher').length;
    const admins = users.filter(u => u.role === 'admin').length;

    // Role distribution
    const roleDistribution = [
      { name: 'Students', value: students, color: '#10B981' },
      { name: 'Teachers', value: teachers, color: '#3B82F6' },
      { name: 'Admins', value: admins, color: '#8B5CF6' }
    ];

    // Institution types
    const institutionTypes = [
      { name: 'Schools', value: institutions.filter(i => i.type === 'school').length },
      { name: 'Colleges', value: institutions.filter(i => i.type === 'college').length },
      { name: 'Universities', value: institutions.filter(i => i.type === 'university').length },
      { name: 'NGOs', value: institutions.filter(i => i.type === 'ngo').length }
    ];

    // Monthly activity (mock data for now)
    const monthlyActivity = [
      { month: 'Jan', users: Math.floor(users.length * 0.4), lessons: Math.floor(lessons.length * 0.3), quizzes: Math.floor(quizzes.length * 0.3) },
      { month: 'Feb', users: Math.floor(users.length * 0.5), lessons: Math.floor(lessons.length * 0.4), quizzes: Math.floor(quizzes.length * 0.4) },
      { month: 'Mar', users: Math.floor(users.length * 0.6), lessons: Math.floor(lessons.length * 0.5), quizzes: Math.floor(quizzes.length * 0.5) },
      { month: 'Apr', users: Math.floor(users.length * 0.7), lessons: Math.floor(lessons.length * 0.6), quizzes: Math.floor(quizzes.length * 0.6) },
      { month: 'May', users: Math.floor(users.length * 0.8), lessons: Math.floor(lessons.length * 0.8), quizzes: Math.floor(quizzes.length * 0.8) },
      { month: 'Jun', users: users.length, lessons: lessons.length, quizzes: quizzes.length }
    ];

    res.json({
      totalUsers: users.length,
      totalStudents: students,
      totalTeachers: teachers,
      totalInstitutions: institutions.length,
      totalLessons: lessons.length,
      totalQuizzes: quizzes.length,
      totalChallenges: challenges.length,
      avgQuizScore: 78, // Mock data
      completionRate: 73, // Mock data
      roleDistribution,
      institutionTypes,
      monthlyActivity
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get leaderboard
router.get('/leaderboard', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { period = 'all-time' } = req.query;

    const studentStats = await StudentStats.find()
      .populate('student_id', 'full_name email institution_id')
      .sort({ total_points: -1 })
      .limit(100);

    const leaderboard = studentStats
      .filter(stat => stat.student_id) // Filter out null populated fields
      .map(stat => ({
        id: stat.student_id._id,
        full_name: stat.student_id.full_name,
        email: stat.student_id.email,
        institution_id: stat.student_id.institution_id,
        total_points: stat.total_points,
        current_level: stat.current_level,
        lessons_completed: stat.lessons_completed,
        eco_impact_score: stat.eco_impact_score,
        badges_earned: stat.badges_earned
      }));

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset user stats
router.post('/users/:id/reset-stats', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const userId = req.params.id;

    // Reset student stats
    await StudentStats.findOneAndUpdate(
      { student_id: userId },
      {
        total_points: 0,
        current_level: 1,
        lessons_completed: 0,
        quizzes_completed: 0,
        challenges_completed: 0,
        eco_impact_score: 0,
        badges_earned: []
      },
      { upsert: true }
    );

    res.json({ message: 'User stats reset successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all quiz results
router.get('/quiz-results', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const QuizAttempt = require('../models/QuizAttempt');
    const attempts = await QuizAttempt.find()
      .populate('quiz_id', 'title')
      .populate('student_id', 'full_name email')
      .sort({ completed_at: -1 });
    res.json(attempts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all challenge submissions
router.get('/challenge-results', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const ChallengeSubmission = require('../models/ChallengeSubmission');
    const submissions = await ChallengeSubmission.find()
      .populate('challenge_id', 'title')
      .populate('student_id', 'full_name email')
      .sort({ submitted_at: -1 });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update content status
router.put('/content/:type/:id/status', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { type, id } = req.params;
    const { status } = req.body;

    let Model;
    switch (type) {
      case 'lessons':
        Model = Lesson;
        break;
      case 'quizzes':
        Model = Quiz;
        break;
      case 'challenges':
        Model = Challenge;
        break;
      default:
        return res.status(400).json({ error: 'Invalid content type' });
    }

    const content = await Model.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    res.json(content);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clean up duplicate student stats
router.post('/cleanup-duplicates', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    // Find all student stats grouped by student_id
    const duplicates = await StudentStats.aggregate([
      {
        $group: {
          _id: '$student_id',
          count: { $sum: 1 },
          docs: { $push: '$_id' }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]);

    let removedCount = 0;
    for (const duplicate of duplicates) {
      // Keep the first document, remove the rest
      const toRemove = duplicate.docs.slice(1);
      await StudentStats.deleteMany({ _id: { $in: toRemove } });
      removedCount += toRemove.length;
    }

    res.json({ message: `Removed ${removedCount} duplicate student stats` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

