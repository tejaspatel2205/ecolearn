const express = require('express');
const Institution = require('../models/Institution');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all institutions
router.get('/', async (req, res) => {
  try {
    const institutions = await Institution.find().sort({ name: 1 });
    res.json(institutions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create institution (admin only)
router.post('/', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const institution = new Institution(req.body);
    await institution.save();
    res.status(201).json(institution);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update institution (admin only)
router.put('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const institution = await Institution.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    if (!institution) {
      return res.status(404).json({ error: 'Institution not found' });
    }
    
    res.json(institution);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete institution (admin only)
router.delete('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const institution = await Institution.findByIdAndDelete(req.params.id);
    
    if (!institution) {
      return res.status(404).json({ error: 'Institution not found' });
    }
    
    res.json({ message: 'Institution deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

