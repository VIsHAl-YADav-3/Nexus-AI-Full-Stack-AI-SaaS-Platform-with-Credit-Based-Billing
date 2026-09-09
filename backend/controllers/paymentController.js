const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const getRazorpayInstance = require('../config/razorpay');
const { getPlan } = require('../config/plans');
const Payment = require('../models/Payment');
const User = require('../models/User');
const logger = require('../utils/logger');

// @desc    Create a Razorpay order for a backend-defined plan
// @route   POST /api/payments/create-order
// @access  Private
//
// SECURITY: The client sends only a `plan` identifier. The amount and credit
// count are always resolved server-side from config/plans.js so a tampered
// request body can never change what the user is charged or credited.
const createOrder = asyncHandler(async (req, res) => {
  const { plan } = req.body;

  const planConfig = getPlan(plan);
  if (!planConfig) {
    res.status(400);
    throw new Error(`Invalid plan "${plan}". Please select a valid plan.`);
  }

  const razorpay = getRazorpayInstance();

  const options = {
    amount: Math.round(planConfig.amount * 100), // convert rupees to paise
    currency: 'INR',
    receipt: `receipt_${req.user._id}_${Date.now()}`,
  };

  const order = await razorpay.orders.create(options);

  await Payment.create({
    userId: req.user._id,
    amount: planConfig.amount,
    currency: 'INR',
    status: 'created',
    planPurchased: plan,
    creditsPurchased: planConfig.credits,
    razorpayOrderId: order.id,
  });

  res.status(201).json({
    success: true,
    order,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
});

// @desc    Verify a Razorpay payment signature and credit the user's account
// @route   POST /api/payments/verify
// @access  Private
const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  // SECURITY: Ownership check. The payment must belong to the currently
  // authenticated user — never look it up by order ID alone.
  const payment = await Payment.findOne({
    razorpayOrderId: razorpay_order_id,
    userId: req.user._id,
  });

  if (!payment) {
    res.status(403);
    throw new Error('Payment not found for this account, or it belongs to another user');
  }

  // IDEMPOTENCY: If this payment has already been captured, do not add
  // credits again. This guards against duplicate/retried verify requests.
  if (payment.status === 'captured') {
    return res.status(200).json({
      success: true,
      message: 'Payment was already verified and credited',
      alreadyProcessed: true,
      credits: req.user.credits,
      plan: req.user.plan,
    });
  }

  // Verify the Razorpay signature before trusting anything else.
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  const isValid = expectedSignature === razorpay_signature;

  if (!isValid) {
    payment.status = 'failed';
    await payment.save();
    res.status(400);
    throw new Error('Payment verification failed: invalid signature');
  }

  // ATOMIC CREDIT: Use a single findOneAndUpdate with a status guard so that
  // two concurrent verify requests for the same order can't both pass the
  // "not yet captured" check and double-credit the user. Only the request
  // that successfully flips the status away from 'captured' proceeds.
  const updatedPayment = await Payment.findOneAndUpdate(
    { _id: payment._id, status: { $ne: 'captured' } },
    {
      $set: {
        status: 'captured',
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      },
    },
    { new: true }
  );

  if (!updatedPayment) {
    // Another concurrent request already captured it first.
    return res.status(200).json({
      success: true,
      message: 'Payment was already verified and credited',
      alreadyProcessed: true,
      credits: req.user.credits,
      plan: req.user.plan,
    });
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $inc: { credits: updatedPayment.creditsPurchased || 0 },
      ...(updatedPayment.planPurchased && {
        $set: { plan: normalizePlanName(updatedPayment.planPurchased) },
      }),
    },
    { new: true }
  );

  logger.info(`Payment captured: order=${razorpay_order_id} user=${req.user._id} credits=+${updatedPayment.creditsPurchased}`);

  res.status(200).json({
    success: true,
    message: 'Payment verified and account credited successfully',
    credits: user.credits,
    plan: user.plan,
  });
});

// Maps a lowercase plan id (e.g. "pro") to the User model's plan enum ("Pro").
const normalizePlanName = (planId) => {
  if (!planId) return undefined;
  const lower = planId.toLowerCase();
  if (lower === 'pro') return 'Pro';
  if (lower === 'basic') return 'Basic';
  return undefined;
};

// @desc    Get the logged-in user's payment history
// @route   GET /api/payments/history
// @access  Private
const getPaymentHistory = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: payments.length, payments });
});

module.exports = { createOrder, verifyPayment, getPaymentHistory };
