const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Persona = require('../models/Persona');
const Conversation = require('../models/Conversation');
const UsageLog = require('../models/UsageLog');
const { streamChatCompletion } = require('../utils/openAI');
const logger = require('../utils/logger');

// How many prior turns (user+assistant pairs) to send back to the model as
// context. Keeps token usage bounded for long-running conversations.
const MAX_CONTEXT_MESSAGES = 20;

// @desc    Stream an AI chat response over SSE, persisting the conversation
//          and deducting credits on completion
// @route   POST /api/ai/chat
// @access  Private
const chat = asyncHandler(async (req, res) => {
  const { prompt, personaId, conversationId } = req.body;
  const user = req.user;

  // 1. Credit check
  if (user.credits <= 0) {
    res.status(403);
    throw new Error('Insufficient credits. Please upgrade your plan to continue.');
  }

  // 2. Combine persona system prompt with the user prompt
  let systemPrompt = 'You are a helpful, precise AI assistant.';
  let toolUsed = 'general-chat';

  if (personaId) {
    const persona = await Persona.findById(personaId);
    if (persona) {
      systemPrompt = persona.systemPrompt;
      toolUsed = persona.name;
    }
  }

  // 3. Get or create the conversation this message belongs to.
  //    SECURITY: always scope to the authenticated user.
  let conversation = null;
  if (conversationId) {
    conversation = await Conversation.findOne({ _id: conversationId, userId: user._id });
    if (!conversation) {
      res.status(404);
      throw new Error('Conversation not found');
    }
  } else {
    conversation = await Conversation.create({
      userId: user._id,
      personaId: personaId || undefined,
      title: prompt.slice(0, 60) || 'New Chat',
      messages: [],
    });
  }

  // 4. Save the user's message immediately so it isn't lost even if the
  //    stream fails partway through.
  conversation.messages.push({ role: 'user', content: prompt, createdAt: new Date() });
  await conversation.save();

  // 5. Build prior-turn context for the model (excluding the message just added).
  const history = conversation.messages
    .slice(0, -1)
    .slice(-MAX_CONTEXT_MESSAGES)
    .map((m) => ({ role: m.role, content: m.content }));

  // 6. Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // ABORT HANDLING: if the client disconnects mid-stream, abort the upstream
  // OpenAI request so we stop generating (and paying for) tokens nobody will
  // ever read.
  let clientClosed = false;
  const abortController = new AbortController();
  req.on('close', () => {
    clientClosed = true;
    abortController.abort();
  });

  try {
    const { fullText, approxTokens } = await streamChatCompletion({
      systemPrompt,
      userPrompt: prompt,
      history,
      signal: abortController.signal,
      onChunk: (delta) => {
        if (!clientClosed) {
          sendEvent('chunk', { delta });
        }
      },
    });

    // Persist whatever the assistant produced, even a partial response, so
    // the conversation history stays consistent. Guard against an empty
    // string if the stream was aborted before any tokens arrived.
    if (fullText) {
      conversation.messages.push({ role: 'assistant', content: fullText, createdAt: new Date() });
      await conversation.save(); // updatedAt bumps automatically via timestamps
    }

    if (!clientClosed) {
      // 7. Deduct credit and log usage once the stream has ended.
      user.credits = Math.max(0, user.credits - 1);
      await user.save();

      await UsageLog.create({
        userId: user._id,
        tokensUsed: approxTokens,
        toolUsed,
      });

      sendEvent('done', {
        message: fullText,
        remainingCredits: user.credits,
        conversationId: conversation._id,
        conversationTitle: conversation.title,
      });
      res.end();
    } else {
      logger.info(`AI stream aborted by client disconnect for conversation ${conversation._id}`);
    }
  } catch (error) {
    if (error.name === 'APIUserAbortError' || error.name === 'AbortError') {
      // Expected when the client disconnects — nothing further to do.
      logger.info(`AI request aborted for conversation ${conversation._id}`);
      return;
    }
    logger.error(`AI stream error: ${error.message}`);
    if (!clientClosed) {
      sendEvent('error', { message: 'The AI service failed to respond. Please try again.' });
      res.end();
    }
  }
});

module.exports = { chat };
