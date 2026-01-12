const express = require('express');
const Quiz = require('../models/Quiz');
const QuizQuestion = require('../models/QuizQuestion');
const QuizAttempt = require('../models/QuizAttempt');
const QuizAnswer = require('../models/QuizAnswer');
const RetakeRequest = require('../models/RetakeRequest');
const StudentStats = require('../models/StudentStats');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get quizzes
router.get('/', authMiddleware, async (req, res) => {
  try {
    let query = {};

    // Filter by class number if provided
    if (req.query.classNumber) {
      query.class_number = req.query.classNumber;
    }

    // Teachers only see their own quizzes
    if (req.user.role === 'teacher') {
      query.teacher_id = req.user._id;
    }
    // Students and admins see all quizzes

    const quizzes = await Quiz.find(query)
      .populate('teacher_id', 'full_name')
      .sort({ created_at: -1 })
      .lean(); // Use lean for performance

    // Fetch question counts for each quiz to display "Questions: X" correctly
    const quizzesWithCounts = await Promise.all(quizzes.map(async (quiz) => {
      const questionCount = await QuizQuestion.countDocuments({ quiz_id: quiz._id });
      const attemptsCount = await QuizAttempt.countDocuments({ quiz_id: quiz._id });

      // Calculate average score
      const attempts = await QuizAttempt.find({ quiz_id: quiz._id, status: 'completed' }).select('percentage');
      const avgScore = attempts.length > 0
        ? attempts.reduce((acc, curr) => acc + curr.percentage, 0) / attempts.length
        : 0;

      return {
        ...quiz,
        questions: { length: questionCount }, // Mock object to match frontend expectation
        stats: {
          attempts: attemptsCount,
          avgScore: Math.round(avgScore)
        }
      };
    }));

    res.json(quizzesWithCounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Request a retake
router.post('/:id/request-retake', authMiddleware, roleMiddleware('student'), async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    const existingRequest = await RetakeRequest.findOne({
      student_id: req.user._id,
      quiz_id: req.params.id,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ error: 'Request already pending' });
    }

    const request = new RetakeRequest({
      student_id: req.user._id,
      quiz_id: req.params.id,
      teacher_id: quiz.teacher_id
    });

    await request.save();
    res.json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get retake requests (Teacher)
router.get('/teacher/requests', authMiddleware, roleMiddleware('teacher'), async (req, res) => {
  try {
    const requests = await RetakeRequest.find({ teacher_id: req.user._id, status: 'pending' })
      .populate('student_id', 'full_name email')
      .populate('quiz_id', 'title')
      .sort({ created_at: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Respond to retake request (Teacher)
router.put('/requests/:requestId', authMiddleware, roleMiddleware('teacher'), async (req, res) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    const request = await RetakeRequest.findById(req.params.requestId);

    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.teacher_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    request.status = status;
    request.responded_at = Date.now();
    await request.save();

    res.json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single quiz with questions
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate('teacher_id', 'full_name');
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Check availability logic...

    // For students, check attempts and retake status
    if (req.user.role === 'student') {
      const attemptsCount = await QuizAttempt.countDocuments({
        quiz_id: quiz._id,
        student_id: req.user._id,
        status: 'completed'
      });

      // Check for any approved requests (that imply an allowed extra attempt)
      // Simple logic: If approved requests count >= attempts count, they can take it?
      // Or simpler: If they have ANY approved request created AFTER their last attempt?
      // Let's go with: Allowed Attempts = 1 + Approved Requests

      const approvedRequests = await RetakeRequest.countDocuments({
        quiz_id: quiz._id,
        student_id: req.user._id,
        status: 'approved'
      });

      const pendingRequest = await RetakeRequest.findOne({
        quiz_id: quiz._id,
        student_id: req.user._id,
        status: 'pending'
      });

      const allowedAttempts = 1 + approvedRequests;
      const canAttempt = attemptsCount < allowedAttempts;

      return res.json({
        ...quiz.toObject(),
        questions: canAttempt ? await QuizQuestion.find({ quiz_id: quiz._id }).select('-correct_answer') : [], // Hide questions if blocked
        canAttempt,
        attemptsCount,
        allowedAttempts,
        requestStatus: pendingRequest ? 'pending' : null
      });
    }

    // For teachers/admins, return everything
    const questions = await QuizQuestion.find({ quiz_id: quiz._id });
    res.json({ ...quiz.toObject(), questions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create quiz (teacher/admin)
router.post('/', authMiddleware, roleMiddleware('teacher', 'admin'), async (req, res) => {
  try {
    const { questions, ...quizData } = req.body;
    const quiz = new Quiz({
      ...quizData,
      teacher_id: req.user._id
    });
    await quiz.save();

    // Create questions
    if (questions && questions.length > 0) {
      const questionDocs = questions.map((q, index) => ({
        ...q,
        quiz_id: quiz._id,
        order_index: index
      }));
      await QuizQuestion.insertMany(questionDocs);
    }

    const createdQuestions = await QuizQuestion.find({ quiz_id: quiz._id });
    res.status(201).json({ ...quiz.toObject(), questions: createdQuestions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update quiz (teacher/admin)
router.put('/:id', authMiddleware, roleMiddleware('teacher', 'admin'), async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Teachers can only update their own quizzes
    if (req.user.role === 'teacher' && quiz.teacher_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { questions, ...quizData } = req.body;

    // Update quiz
    const updatedQuiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      quizData,
      { new: true }
    );

    // Update questions if provided
    if (questions) {
      await QuizQuestion.deleteMany({ quiz_id: req.params.id });
      if (questions.length > 0) {
        const questionDocs = questions.map((q, index) => ({
          ...q,
          quiz_id: req.params.id,
          order_index: index
        }));
        await QuizQuestion.insertMany(questionDocs);
      }
    }

    const updatedQuestions = await QuizQuestion.find({ quiz_id: req.params.id });
    res.json({ ...updatedQuiz.toObject(), questions: updatedQuestions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete quiz (teacher/admin)
router.delete('/:id', authMiddleware, roleMiddleware('teacher', 'admin'), async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Teachers can only delete their own quizzes
    if (req.user.role === 'teacher' && quiz.teacher_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete related data
    await QuizQuestion.deleteMany({ quiz_id: req.params.id });
    await QuizAttempt.deleteMany({ quiz_id: req.params.id });
    await Quiz.findByIdAndDelete(req.params.id);

    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit quiz (student)
router.post('/:id/submit', authMiddleware, roleMiddleware('student'), async (req, res) => {
  try {
    const { answers } = req.body;
    const quiz = await Quiz.findById(req.params.id);
    const questions = await QuizQuestion.find({ quiz_id: req.params.id });

    // Create attempt
    const attempt = new QuizAttempt({
      quiz_id: req.params.id,
      student_id: req.user._id,
      status: 'in_progress'
    });
    await attempt.save();

    // Calculate score
    let totalScore = 0;
    let totalMarks = 0;

    for (const question of questions) {
      totalMarks += question.marks;
      const studentAnswer = answers[question._id.toString()] || '';

      const normalize = (str) => String(str).trim().toLowerCase().replace(/\s+/g, ' ');

      const normalizedStudent = normalize(studentAnswer);
      const normalizedCorrect = normalize(question.correct_answer);

      // Strict check for multiple choice (exact match expected usually simple like 'A', 'B')
      // For short answer, fuzzy matching is better handling
      const isCorrect = normalizedStudent === normalizedCorrect;

      // Debug log for troubleshooting (can be removed later)
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[Quiz Grade] Q: ${question.question_text}`);
        console.log(`  Student: "${normalizedStudent}" (raw: "${studentAnswer}")`);
        console.log(`  Correct: "${normalizedCorrect}" (raw: "${question.correct_answer}")`);
        console.log(`  Match: ${isCorrect}`);
      }

      if (isCorrect) {
        totalScore += question.marks;
      }

      // Save answer
      const answer = new QuizAnswer({
        attempt_id: attempt._id,
        question_id: question._id,
        student_answer: studentAnswer,
        is_correct: isCorrect,
        marks_obtained: isCorrect ? question.marks : 0
      });
      await answer.save();
    }

    const percentage = totalMarks > 0 ? (totalScore / totalMarks) * 100 : 0;

    // Update attempt
    attempt.score = totalScore;
    attempt.total_marks = totalMarks;
    attempt.percentage = percentage;
    attempt.status = 'completed';
    attempt.completed_at = Date.now();
    await attempt.save();

    // Update student stats
    let stats = await StudentStats.findOne({ student_id: req.user._id });
    if (!stats) {
      stats = new StudentStats({
        student_id: req.user._id,
        total_points: 0,
        current_level: 1,
        quizzes_completed: 0
      });
    }

    stats.total_points += Math.round(percentage * 2); // 2 points per percentage
    stats.quizzes_completed += 1;
    stats.current_level = Math.max(1, Math.floor(Math.sqrt(stats.total_points / 100)) + 1);
    await stats.save();

    res.json({
      score: totalScore,
      total_marks: totalMarks,
      percentage: percentage.toFixed(2)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get quiz attempts (teacher and admin)
router.get('/:id/attempts', authMiddleware, roleMiddleware('teacher', 'admin'), async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Teachers can only view analytics for their own quizzes (Admins bypass this)
    if (req.user.role === 'teacher' && quiz.teacher_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const attempts = await QuizAttempt.find({ quiz_id: req.params.id })
      .populate('student_id', 'full_name email')
      .sort({ created_at: -1 });

    res.json(attempts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

