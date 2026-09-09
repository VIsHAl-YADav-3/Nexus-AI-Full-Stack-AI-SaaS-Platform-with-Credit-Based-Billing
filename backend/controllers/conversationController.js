const asyncHandler = require('express-async-handler');
const Conversation = require('../models/Conversation');

// @desc    Create a new (empty) conversation
// @route   POST /api/conversations
// @access  Private
const createConversation = asyncHandler(async (req, res) => {
  const { personaId, title } = req.body;

  const conversation = await Conversation.create({
    userId: req.user._id,
    personaId: personaId || undefined,
    title: title || 'New Chat',
    messages: [],
  });

  res.status(201).json({ success: true, conversation });
});

// @desc    Get all conversations for the logged-in user (most recent first)
// @route   GET /api/conversations
// @access  Private
const getConversations = asyncHandler(async (req, res) => {
  // Return a lightweight list — omit the full message bodies for performance;
  // the sidebar only needs id/title/timestamps.
  const conversations = await Conversation.find({ userId: req.user._id })
    .select('title personaId createdAt updatedAt messages')
    .sort({ updatedAt: -1 });

  const summarized = conversations.map((c) => ({
    _id: c._id,
    title: c.title,
    personaId: c.personaId,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    messageCount: c.messages.length,
    lastMessage: c.messages[c.messages.length - 1]?.content?.slice(0, 80) || '',
  }));

  res.status(200).json({ success: true, count: summarized.length, conversations: summarized });
});

// @desc    Get a single conversation with its full message history
// @route   GET /api/conversations/:id
// @access  Private
const getConversationById = asyncHandler(async (req, res) => {
  // SECURITY: always scope the lookup to the authenticated user so nobody
  // can read another user's conversation by guessing an ID.
  const conversation = await Conversation.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }

  res.status(200).json({ success: true, conversation });
});

// @desc    Rename a conversation (or update its persona)
// @route   PUT /api/conversations/:id
// @access  Private
const updateConversation = asyncHandler(async (req, res) => {
  const { title, personaId } = req.body;

  const conversation = await Conversation.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }

  if (title !== undefined) {
    if (!title.trim()) {
      res.status(400);
      throw new Error('Title cannot be empty');
    }
    conversation.title = title.trim();
  }
  if (personaId !== undefined) conversation.personaId = personaId || undefined;

  await conversation.save();
  res.status(200).json({ success: true, conversation });
});

// @desc    Delete a conversation
// @route   DELETE /api/conversations/:id
// @access  Private
const deleteConversation = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }

  res.status(200).json({ success: true, message: 'Conversation deleted successfully' });
});

module.exports = {
  createConversation,
  getConversations,
  getConversationById,
  updateConversation,
  deleteConversation,
};
