import { useCallback, useRef, useState } from 'react';
import { BASE_URL } from '../services/api';

/**
 * Streams a POST-based SSE response from /api/ai/chat.
 * The native EventSource API doesn't support POST bodies or custom headers,
 * so we use fetch() with a ReadableStream reader and parse SSE frames manually.
 */
export const useSSE = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef(null);

  const streamChat = useCallback(async ({ prompt, personaId, conversationId, onChunk, onDone, onError }) => {
    const token = localStorage.getItem('nexus_token');
    const controller = new AbortController();
    abortRef.current = controller;
    setIsStreaming(true);

    try {
      const response = await fetch(`${BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ prompt, personaId, conversationId }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.message || `Request failed with status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      // Parse loop: SSE frames are separated by a blank line ("\n\n").
      // Each frame looks like:
      //   event: chunk
      //   data: {"delta":"..."}
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split('\n\n');
        buffer = frames.pop(); // keep the last, possibly incomplete frame

        for (const frame of frames) {
          const lines = frame.split('\n');
          let eventType = 'message';
          let dataLine = '';

          for (const line of lines) {
            if (line.startsWith('event:')) eventType = line.replace('event:', '').trim();
            if (line.startsWith('data:')) dataLine = line.replace('data:', '').trim();
          }

          if (!dataLine) continue;
          let payload;
          try {
            payload = JSON.parse(dataLine);
          } catch {
            continue;
          }

          if (eventType === 'chunk' && onChunk) onChunk(payload.delta);
          if (eventType === 'done' && onDone) onDone(payload);
          if (eventType === 'error' && onError) onError(payload.message);
        }
      }
    } catch (error) {
      if (error.name !== 'AbortError' && onError) {
        onError(error.message || 'Something went wrong while streaming the response');
      }
    } finally {
      setIsStreaming(false);
    }
  }, []);

  const stopStream = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { streamChat, stopStream, isStreaming };
};
