const { body, validationResult } = require('express-validator');

/**
 * Runs after the express-validator chains below to collect and format errors.
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array(),
    });
  }
  next();
};

const signupValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  handleValidationErrors,
];

const loginValidation = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors,
];

const forgotPasswordValidation = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  handleValidationErrors,
];

const resetPasswordValidation = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('otp').notEmpty().withMessage('OTP is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),
  handleValidationErrors,
];

const chatValidation = [
  body('prompt').trim().notEmpty().withMessage('Prompt cannot be empty'),
  body('personaId').optional().isMongoId().withMessage('Invalid persona ID'),
  body('conversationId').optional().isMongoId().withMessage('Invalid conversation ID'),
  handleValidationErrors,
];

const conversationCreateValidation = [
  body('personaId').optional().isMongoId().withMessage('Invalid persona ID'),
  body('title').optional().isString().trim().isLength({ max: 120 }).withMessage('Title is too long'),
  handleValidationErrors,
];

const conversationUpdateValidation = [
  body('title')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ max: 120 })
    .withMessage('Title is too long'),
  body('personaId').optional().isMongoId().withMessage('Invalid persona ID'),
  handleValidationErrors,
];

const createOrderValidation = [
  // SECURITY: only a plan identifier is accepted from the client — never an
  // amount or credit count. The backend resolves the real price from
  // config/plans.js in the controller.
  body('plan')
    .trim()
    .notEmpty()
    .withMessage('A plan is required')
    .isString()
    .withMessage('Plan must be a string')
    .isIn(['basic', 'pro'])
    .withMessage('Invalid plan selected'),
  handleValidationErrors,
];

const verifyPaymentValidation = [
  body('razorpay_order_id').notEmpty().withMessage('Order ID is required'),
  body('razorpay_payment_id').notEmpty().withMessage('Payment ID is required'),
  body('razorpay_signature').notEmpty().withMessage('Signature is required'),
  handleValidationErrors,
];

module.exports = {
  handleValidationErrors,
  signupValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  chatValidation,
  createOrderValidation,
  verifyPaymentValidation,
  conversationCreateValidation,
  conversationUpdateValidation,
};
