const express = require('express');
const Class = require('../models/Class');
const ClassEnrollment = require('../models/ClassEnrollment');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all classes (teacher sees their classes, admin sees all)
router.get('/', authMiddleware, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'teacher') {
      query.teacher_id = req.user._id;
    }
    const classes = await Class.find(query).populate('institution_id teacher_id');
    res.json(classes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create class (teacher/admin)
router.post('/', authMiddleware, roleMiddleware('teacher', 'admin'), async (req, res) => {
  try {
    const classData = {
      ...req.body,
      teacher_id: req.user.role === 'teacher' ? req.user._id : req.body.teacher_id
    };
    const newClass = new Class(classData);
    await newClass.save();
    res.status(201).json(newClass);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update class
router.put('/:id', authMiddleware, roleMiddleware('teacher', 'admin'), async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id);
    
    if (!classItem) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    // Teachers can only update their own classes
    if (req.user.role === 'teacher' && classItem.teacher_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const updatedClass = await Class.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    res.json(updatedClass);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete class
router.delete('/:id', authMiddleware, roleMiddleware('teacher', 'admin'), async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id);
    
    if (!classItem) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    // Teachers can only delete their own classes
    if (req.user.role === 'teacher' && classItem.teacher_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await Class.findByIdAndDelete(req.params.id);
    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enroll student in class
router.post('/:classId/enroll', authMiddleware, roleMiddleware('teacher', 'admin'), async (req, res) => {
  try {
    const { studentId } = req.body;
    const enrollment = new ClassEnrollment({
      class_id: req.params.classId,
      student_id: studentId
    });
    await enrollment.save();
    res.status(201).json(enrollment);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Student already enrolled' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

module.exports = router;

