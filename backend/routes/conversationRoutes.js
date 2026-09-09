const express = require('express');
const router = express.Router();
const {
  createConversation,
  getConversations,
  getConversationById,
  updateConversation,
  deleteConversation,
} = require('../controllers/conversationController');
const { protect } = require('../middleware/authMiddleware');
const {
  conversationCreateValidation,
  conversationUpdateValidation,
} = require('../middleware/validator');

// Every route below requires authentication, and every controller query is
// additionally scoped to req.user._id so users can only ever touch their
// own conversations.
router.use(protect);

router.post('/', conversationCreateValidation, createConversation);
router.get('/', getConversations);
router.get('/:id', getConversationById);
router.put('/:id', conversationUpdateValidation, updateConversation);
router.delete('/:id', deleteConversation);

module.exports = router;
