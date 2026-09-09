const asyncHandler = require('express-async-handler');
const UsageLog = require('../models/UsageLog');

// @desc    Get usage analytics for the logged-in user
// @route   GET /api/analytics
// @access  Private
const getAnalytics = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Daily token usage for the last 14 days, grouped by date.
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const dailyUsage = await UsageLog.aggregate([
    { $match: { userId, date: { $gte: fourteenDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        tokensUsed: { $sum: '$tokensUsed' },
        requests: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const totalChats = await UsageLog.countDocuments({ userId });

  const recentLogs = await UsageLog.find({ userId }).sort({ date: -1 }).limit(20);

  res.status(200).json({
    success: true,
    remainingCredits: req.user.credits,
    totalChats,
    dailyUsage: dailyUsage.map((d) => ({
      date: d._id,
      tokensUsed: d.tokensUsed,
      requests: d.requests,
    })),
    recentLogs,
  });
});

module.exports = { getAnalytics };
