const express = require('express');
const router = express.Router();
const { handleRazorpayWebhook } = require('../controllers/webhookController');

// NOTE: the express.raw() body parser for this route is applied in
// server.js, mounted *before* the global express.json() parser, so the
// signature check in the controller sees Razorpay's exact raw bytes.
router.post('/razorpay', handleRazorpayWebhook);

module.exports = router;
