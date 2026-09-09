import { createContext, useContext, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  getConversationsRequest,
  getConversationRequest,
  updateConversationRequest,
  deleteConversationRequest,
} from '../services/api';

const ChatContext = createContext(null);

/**
 * Holds chat-related state shared across the Chat page and its sidebar:
 *  - transient state that needs to travel between pages without a full
 *    re-fetch (e.g. a template's prompt text pre-filling the Chat page)
 *  - the persisted conversation list (sidebar) and the active conversation
 */
export const ChatProvider = ({ children }) => {
  const [pendingPrompt, setPendingPrompt] = useState('');
  const [pendingPersonaId, setPendingPersonaId] = useState(null);

  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [conversationsError, setConversationsError] = useState(null);
  const [activeConversationId, setActiveConversationId] = useState(null);

  const queuePrompt = (text, personaId = null) => {
    setPendingPrompt(text);
    setPendingPersonaId(personaId);
  };

  const consumePrompt = () => {
    const text = pendingPrompt;
    setPendingPrompt('');
    return text;
  };

  const fetchConversations = useCallback(async () => {
    setConversationsLoading(true);
    setConversationsError(null);
    try {
      const { data } = await getConversationsRequest();
      setConversations(data.conversations);
    } catch (error) {
      setConversationsError(error.response?.data?.message || 'Could not load chat history');
    } finally {
      setConversationsLoading(false);
    }
  }, []);

  const loadConversation = useCallback(async (id) => {
    const { data } = await getConversationRequest(id);
    setActiveConversationId(id);
    return data.conversation;
  }, []);

  const startNewConversation = useCallback(() => {
    setActiveConversationId(null);
  }, []);

  // Called once a chat's first message completes and the backend returns a
  // freshly-created conversation id/title, so the sidebar list stays in sync
  // without a full re-fetch.
  const upsertConversationSummary = useCallback((summary) => {
    setConversations((prev) => {
      const exists = prev.some((c) => c._id === summary._id);
      const next = exists
        ? prev.map((c) => (c._id === summary._id ? { ...c, ...summary } : c))
        : [summary, ...prev];
      // Keep most-recently-updated first.
      return [...next].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    });
  }, []);

  const renameConversation = useCallback(async (id, title) => {
    const { data } = await updateConversationRequest(id, { title });
    setConversations((prev) => prev.map((c) => (c._id === id ? { ...c, title: data.conversation.title } : c)));
    toast.success('Conversation renamed');
    return data.conversation;
  }, []);

  const removeConversation = useCallback(
    async (id) => {
      await deleteConversationRequest(id);
      setConversations((prev) => prev.filter((c) => c._id !== id));
      if (activeConversationId === id) {
        setActiveConversationId(null);
      }
      toast.success('Conversation deleted');
    },
    [activeConversationId]
  );

  return (
    <ChatContext.Provider
      value={{
        pendingPrompt,
        pendingPersonaId,
        queuePrompt,
        consumePrompt,
        conversations,
        conversationsLoading,
        conversationsError,
        activeConversationId,
        setActiveConversationId,
        fetchConversations,
        loadConversation,
        startNewConversation,
        upsertConversationSummary,
        renameConversation,
        removeConversation,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChatContext must be used within a ChatProvider');
  return ctx;
};
