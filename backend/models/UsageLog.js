const mongoose = require('mongoose');

const UsageLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  tokensUsed: {
    type: Number,
    required: true,
    default: 0,
  },
  toolUsed: {
    type: String,
    required: true,
    default: 'chat',
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('UsageLog', UsageLogSchema);
