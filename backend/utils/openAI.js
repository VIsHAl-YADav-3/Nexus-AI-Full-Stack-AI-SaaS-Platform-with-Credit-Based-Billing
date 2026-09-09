const OpenAI = require('openai');

let client = null;

const getOpenAIClient = () => {
  if (!client) {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error(
        'OPENROUTER_API_KEY is not configured in environment variables'
      );
    }

    client = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
    });
  }

  return client;
};


/**
 * Streams a chat completion from OpenRouter
 */
const streamChatCompletion = async ({
  systemPrompt,
  userPrompt,
  history = [],
  onChunk,
  signal,
}) => {

  const openai = getOpenAIClient();

  const messages = [
    {
      role: 'system',
      content: systemPrompt || 'You are a helpful AI assistant.',
    },

    ...history.map((m) => ({
      role: m.role,
      content: m.content,
    })),

    {
      role: 'user',
      content: userPrompt,
    },
  ];


  const stream = await openai.chat.completions.create(
    {
      // OpenRouter model
      model: 'openai/gpt-4o-mini',

      stream: true,

      messages,
    },

    {
      signal,
    }
  );


  let fullText = '';


  for await (const part of stream) {

    const delta =
      part.choices?.[0]?.delta?.content || '';


    if (delta) {

      fullText += delta;

      onChunk(delta);

    }
  }


  const approxTokens = Math.max(
    1,
    Math.ceil(fullText.length / 4)
  );


  return {
    fullText,
    approxTokens,
  };

};


module.exports = {
  getOpenAIClient,
  streamChatCompletion,
};