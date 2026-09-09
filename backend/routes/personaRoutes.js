const express = require('express');
const router = express.Router();
const {
  getPersonas,
  createPersona,
  updatePersona,
  deletePersona,
} = require('../controllers/personaController');
const { protect } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');

// Read access: any authenticated user.
router.get('/', protect, getPersonas);

// Write access: admins only. System personas are shared/global, so normal
// users must not be able to create, edit, or delete them.
router.post('/', protect, requireAdmin, createPersona);
router.put('/:id', protect, requireAdmin, updatePersona);
router.delete('/:id', protect, requireAdmin, deletePersona);

module.exports = router;
