const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['created', 'pending', 'captured', 'failed'],
      default: 'created',
      index: true,
    },
    creditsPurchased: {
      type: Number,
      default: 0,
    },
    planPurchased: {
      type: String,
      default: 'Pro',
    },
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true, // one payment record per Razorpay order — prevents duplicate rows
    },
    razorpayPaymentId: {
      type: String,
    },
    razorpaySignature: {
      type: String,
    },
  },
  { timestamps: true } // adds both createdAt and updatedAt
);

module.exports = mongoose.model('Payment', PaymentSchema);
