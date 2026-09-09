const express = require('express');
const router = express.Router();
const {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} = require('../controllers/templateController');
const { protect } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');

// Read access: any authenticated user.
router.get('/', protect, getTemplates);

// Write access: admins only. Templates are shared/global, so normal users
// must not be able to create, edit, or delete them.
router.post('/', protect, requireAdmin, createTemplate);
router.put('/:id', protect, requireAdmin, updateTemplate);
router.delete('/:id', protect, requireAdmin, deleteTemplate);

module.exports = router;
