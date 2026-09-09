const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const logger = require('../utils/logger');
const { sendPasswordResetOtp } = require('../services/emailService');

// OTPs are hashed before storage (same principle as passwords) so that a
// database read/leak alone can't be used to reset an account.
const hashOtp = (otp) => crypto.createHash('sha256').update(otp).digest('hex');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  credits: user.credits,
  plan: user.plan,
  role: user.role,
  createdAt: user.createdAt,
});

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(409);
    throw new Error('An account with that email already exists');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    token,
    user: sanitizeUser(user),
  });
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    message: 'Logged in successfully',
    token,
    user: sanitizeUser(user),
  });
});

// @desc    Get logged-in user's profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    user: sanitizeUser(req.user),
  });
});

// @desc    Generate a password-reset OTP and email it to the user
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  // Always respond with the same generic message, whether or not the email
  // is registered, to avoid leaking which accounts exist.
  const genericResponse = {
    success: true,
    message: 'If that email is registered, a reset code has been sent',
  };

  if (!user) {
    return res.status(200).json(genericResponse);
  }

  const otp = crypto.randomInt(100000, 999999).toString();

  // Store only the hash — the raw OTP is never persisted.
  user.resetPasswordOTP = hashOtp(otp);
  user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save();

  try {
    await sendPasswordResetOtp({ to: user.email, name: user.name, otp });
  } catch (error) {
    // The email provider failed — invalidate the OTP we just issued so it
    // can't be silently reused, and let the user know something went wrong
    // without revealing account existence or provider internals.
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    logger.error(`Password reset email delivery failed for ${email}: ${error.message}`);
    res.status(502);
    throw new Error('We could not send the reset email right now. Please try again shortly.');
  }

  // NOTE: the OTP is never included in the API response or logged, even in
  // development — check your inbox (or the configured Resend testing
  // address) to retrieve it.
  res.status(200).json(genericResponse);
});

// @desc    Reset password using OTP
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const user = await User.findOne({
    email,
    resetPasswordOTP: hashOtp(otp),
    resetPasswordExpires: { $gt: Date.now() },
  }).select('+password +resetPasswordOTP +resetPasswordExpires');

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired reset code');
  }

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  // Invalidate the OTP immediately so it can never be reused.
  user.resetPasswordOTP = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password has been reset successfully. Please log in.',
  });
});

module.exports = { signup, login, getMe, forgotPassword, resetPassword };
