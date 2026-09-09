const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const Payment = require('../models/Payment');
const User = require('../models/User');
const logger = require('../utils/logger');

const PLAN_NAME_MAP = { basic: 'Basic', pro: 'Pro' };

/**
 * Handles Razorpay webhook events (primarily `payment.captured`) as a
 * reliability backstop to the client-driven /payments/verify flow — e.g. if
 * the user closes the tab right after paying but before the verify call
 * completes, the webhook still credits their account.
 *
 * IMPORTANT: this route must receive the *raw* request body (see
 * server.js), because the webhook signature is computed over the exact raw
 * bytes Razorpay sent — a re-serialized JSON body would not match.
 *
 * Idempotency: identical to the client-verification path — credits are only
 * added on the transition into 'captured', guarded by an atomic update.
 */
const handleRazorpayWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    logger.error('RAZORPAY_WEBHOOK_SECRET is not configured — rejecting webhook');
    return res.status(500).json({ success: false, message: 'Webhook not configured' });
  }

  if (!signature) {
    return res.status(400).json({ success: false, message: 'Missing webhook signature' });
  }

  // req.body is a raw Buffer here (see the express.raw() middleware applied
  // to this route in server.js), which is required for signature verification.
  const rawBody = req.body;

  const expectedSignature = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');

  if (expectedSignature !== signature) {
    logger.warn('Razorpay webhook signature mismatch — rejecting');
    return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString('utf8'));
  } catch {
    return res.status(400).json({ success: false, message: 'Malformed webhook payload' });
  }

  const eventType = event.event;

  // Only act on successful captures; other events (order.paid, payment.failed,
  // etc.) are acknowledged but not processed further in this project.
  if (eventType !== 'payment.captured') {
    return res.status(200).json({ success: true, message: `Event ${eventType} acknowledged` });
  }

  const paymentEntity = event.payload?.payment?.entity;
  const razorpayOrderId = paymentEntity?.order_id;
  const razorpayPaymentId = paymentEntity?.id;

  if (!razorpayOrderId || !razorpayPaymentId) {
    return res.status(400).json({ success: false, message: 'Malformed payment entity in webhook' });
  }

  const payment = await Payment.findOne({ razorpayOrderId });
  if (!payment) {
    logger.warn(`Webhook received for unknown order ${razorpayOrderId}`);
    return res.status(200).json({ success: true, message: 'No matching payment record; ignored' });
  }

  // Idempotent, atomic transition — mirrors the logic in paymentController.verifyPayment.
  const updatedPayment = await Payment.findOneAndUpdate(
    { _id: payment._id, status: { $ne: 'captured' } },
    {
      $set: {
        status: 'captured',
        razorpayPaymentId,
      },
    },
    { new: true }
  );

  if (!updatedPayment) {
    // Already captured (likely by the client-side verify call) — no-op.
    return res.status(200).json({ success: true, message: 'Already processed' });
  }

  await User.findByIdAndUpdate(payment.userId, {
    $inc: { credits: updatedPayment.creditsPurchased || 0 },
    ...(updatedPayment.planPurchased && {
      $set: { plan: PLAN_NAME_MAP[updatedPayment.planPurchased.toLowerCase()] || undefined },
    }),
  });

  logger.info(`Webhook captured payment: order=${razorpayOrderId} user=${payment.userId}`);

  res.status(200).json({ success: true, message: 'Payment processed via webhook' });
});

module.exports = { handleRazorpayWebhook };
