const express = require('express');
const router = express.Router();
const { chat } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');
const { aiChatLimiter } = require('../middleware/rateLimiter');
const { chatValidation } = require('../middleware/validator');

router.post('/chat', protect, aiChatLimiter, chatValidation, chat);

module.exports = router;
