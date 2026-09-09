const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment, getPaymentHistory } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const { createOrderValidation, verifyPaymentValidation } = require('../middleware/validator');

router.post('/create-order', protect, createOrderValidation, createOrder);
router.post('/verify', protect, verifyPaymentValidation, verifyPayment);
router.get('/history', protect, getPaymentHistory);

module.exports = router;
