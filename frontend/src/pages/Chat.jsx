import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Send,
  Copy,
  RefreshCw,
  Loader2,
  ChevronDown,
  Lock,
  Check,
  Bot,
  User as UserIcon,
  History,
  StopCircle,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import AppShell from '../components/AppShell';
import ChatSidebar from '../components/ChatSidebar';
import { useAuth } from '../context/AuthContext';
import { useChatContext } from '../context/ChatContext';
import { useSSE } from '../hooks/useSSE';
import { getPersonasRequest } from '../services/api';

const CodeBlock = ({ inline, className, children }) => {
  const [copied, setCopied] = useState(false);
  const codeText = String(children).replace(/\n$/, '');

  if (inline) {
    return <code className="bg-white/[0.08] px-1.5 py-0.5 rounded text-[13px] text-accent-emerald">{children}</code>;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(codeText);
    setCopied(true);
    toast.success('Code copied');
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="relative group my-3 rounded-xl overflow-hidden border border-white/[0.08]">
      <div className="flex items-center justify-between bg-base-900 px-3 py-1.5 border-b border-white/[0.06]">
        <span className="text-[11px] text-zinc-500 font-mono">{className?.replace('language-', '') || 'code'}</span>
        <button onClick={handleCopy} className="text-zinc-500 hover:text-zinc-200 transition-colors">
          {copied ? <Check className="w-3.5 h-3.5 text-accent-emerald" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      <pre className="bg-base-950 p-3.5 overflow-x-auto text-[13px] leading-relaxed">
        <code>{codeText}</code>
      </pre>
    </div>
  );
};

const ChatBubble = ({ role, content, streaming }) => {
  const isUser = role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} animate-fadeUp`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser ? 'bg-white/[0.08]' : 'bg-glow-gradient shadow-glow'
        }`}
      >
        {isUser ? <UserIcon className="w-4 h-4 text-zinc-300" /> : <Bot className="w-4 h-4 text-white" />}
      </div>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser ? 'bg-glow-gradient text-white' : 'glass-card text-zinc-200'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{content}</p>
        ) : (
          <div className="prose-chat">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: CodeBlock }}>
              {content || ' '}
            </ReactMarkdown>
            {streaming && <span className="inline-block w-1.5 h-4 bg-accent-violet ml-0.5 animate-blink align-middle" />}
          </div>
        )}
      </div>
    </div>
  );
};

const Chat = () => {
  const { user, updateCredits } = useAuth();
  const {
    pendingPrompt,
    pendingPersonaId,
    consumePrompt,
    activeConversationId,
    setActiveConversationId,
    fetchConversations,
    loadConversation,
    startNewConversation,
    upsertConversationSummary,
  } = useChatContext();
  const navigate = useNavigate();
  const { streamChat, stopStream, isStreaming } = useSSE();

  const [personas, setPersonas] = useState([]);
  const [personasLoading, setPersonasLoading] = useState(true);
  const [personasError, setPersonasError] = useState(null);
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [input, setInput] = useState('');
  const [lastUserPrompt, setLastUserPrompt] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [streamError, setStreamError] = useState(null);

  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  // --- Load personas ---
  useEffect(() => {
    const fetchPersonas = async () => {
      setPersonasError(null);
      try {
        const { data } = await getPersonasRequest();
        setPersonas(data.personas);
        const preset = pendingPersonaId
          ? data.personas.find((p) => p._id === pendingPersonaId)
          : null;
        setSelectedPersona(preset || data.personas[0] || null);
      } catch (error) {
        setPersonasError(error.response?.data?.message || 'Could not load personas');
        toast.error('Could not load personas');
      } finally {
        setPersonasLoading(false);
      }
    };
    fetchPersonas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Load chat history sidebar ---
  useEffect(() => {
    fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Prefill from a template, if any ---
  useEffect(() => {
    const prefill = consumePrompt();
    if (prefill) setInput(prefill);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  // Abort any in-flight stream if the user navigates away mid-response —
  // pairs with the backend's AbortController handling in aiController.js.
  useEffect(() => () => stopStream(), [stopStream]);

  const handleSelectConversation = async (id) => {
    if (isStreaming) {
      toast.error('Please wait for the current response to finish');
      return;
    }
    setSidebarOpen(false);
    setMessagesLoading(true);
    setStreamError(null);
    try {
      const conversation = await loadConversation(id);
      setMessages(conversation.messages.map((m) => ({ role: m.role, content: m.content })));
      if (conversation.personaId) {
        const persona = personas.find((p) => p._id === conversation.personaId);
        if (persona) setSelectedPersona(persona);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load conversation');
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleNewChat = () => {
    if (isStreaming) {
      toast.error('Please wait for the current response to finish');
      return;
    }
    setSidebarOpen(false);
    setMessages([]);
    setStreamError(null);
    startNewConversation();
  };

  const sendPrompt = (promptText) => {
    if (!promptText.trim() || isStreaming) return;
    if ((user?.credits ?? 0) <= 0) {
      toast.error('You are out of credits');
      navigate('/pricing');
      return;
    }

    setStreamError(null);
    const userMessage = { role: 'user', content: promptText };
    const assistantMessage = { role: 'assistant', content: '', streaming: true };
    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setLastUserPrompt(promptText);
    setInput('');

    let accumulated = '';

    streamChat({
      prompt: promptText,
      personaId: selectedPersona?._id,
      conversationId: activeConversationId || undefined,
      onChunk: (delta) => {
        accumulated += delta;
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: 'assistant', content: accumulated, streaming: true };
          return next;
        });
      },
      onDone: (payload) => {
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: 'assistant', content: payload.message || accumulated, streaming: false };
          return next;
        });
        if (typeof payload.remainingCredits === 'number') {
          updateCredits(payload.remainingCredits);
        }
        if (payload.conversationId) {
          setActiveConversationId(payload.conversationId);
          upsertConversationSummary({
            _id: payload.conversationId,
            title: payload.conversationTitle || 'New Chat',
            updatedAt: new Date().toISOString(),
            messageCount: messages.length + 2,
            lastMessage: (payload.message || accumulated).slice(0, 80),
          });
        }
      },
      onError: (message) => {
        const errMsg = message || 'The AI failed to respond';
        setStreamError(errMsg);
        toast.error(errMsg);
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            role: 'assistant',
            content: '_Something went wrong generating this response._',
            streaming: false,
          };
          return next;
        });
      },
    });
  };

  const handleSend = () => sendPrompt(input);

  const handleStop = () => {
    stopStream();
  };

  const handleRegenerate = () => {
    if (!lastUserPrompt) return;
    setMessages((prev) => prev.slice(0, -1));
    sendPrompt(lastUserPrompt);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const outOfCredits = (user?.credits ?? 0) <= 0;

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto flex h-[calc(100vh-140px)]">
        <ChatSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onSelectConversation={handleSelectConversation}
          onNewChat={handleNewChat}
        />

        <div className="flex-1 min-w-0 flex flex-col">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4 gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden ghost-btn !p-2.5"
                aria-label="Chat history"
              >
                <History className="w-4 h-4" />
              </button>

              <div className="relative">
                <button
                  onClick={() => setDropdownOpen((v) => !v)}
                  disabled={personasLoading}
                  className="ghost-btn flex items-center gap-2 text-sm"
                >
                  <Bot className="w-4 h-4 text-accent-violet" />
                  {personasLoading
                    ? 'Loading personas…'
                    : personasError
                    ? 'Personas unavailable'
                    : selectedPersona?.name || 'Select persona'}
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                </button>
                {dropdownOpen && !personasLoading && !personasError && (
                  <div className="absolute left-0 mt-2 w-72 glass-card p-1.5 z-20 max-h-80 overflow-y-auto animate-fadeUp">
                    {personas.map((p) => (
                      <button
                        key={p._id}
                        onClick={() => {
                          setSelectedPersona(p);
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors duration-150 ${
                          selectedPersona?._id === p._id ? 'bg-white/[0.08]' : 'hover:bg-white/[0.05]'
                        }`}
                      >
                        <p className="text-sm font-medium text-zinc-100">{p.name}</p>
                        <p className="text-xs text-zinc-500 mt-0.5 leading-snug">{p.description}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isStreaming && (
                <button
                  onClick={handleStop}
                  className="ghost-btn flex items-center gap-1.5 text-xs py-1.5 px-3 text-amber-400 border-amber-500/20"
                >
                  <StopCircle className="w-3.5 h-3.5" /> Stop
                </button>
              )}
              {messages.length > 0 && !isStreaming && (
                <button
                  onClick={handleRegenerate}
                  className="ghost-btn flex items-center gap-1.5 text-xs py-1.5 px-3"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                </button>
              )}
            </div>
          </div>

          {streamError && (
            <div className="glass-card p-3 mb-3 border-red-500/20 bg-red-500/5 flex items-center gap-2 text-xs text-red-300">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {streamError}
            </div>
          )}

          {/* Chat log */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto glass-card p-4 sm:p-6 space-y-5 mb-4">
            {messagesLoading ? (
              <div className="py-4">
                <p className="text-xs text-zinc-500 mb-3">Loading conversation…</p>
                <div className="skeleton h-16 w-2/3 rounded-2xl ml-auto mb-4" />
                <div className="skeleton h-24 w-3/4 rounded-2xl" />
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16">
                <div className="w-14 h-14 rounded-2xl bg-glow-gradient flex items-center justify-center shadow-glow mb-4">
                  <Bot className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-white font-medium mb-1">Start a conversation</h3>
                <p className="text-sm text-zinc-500 max-w-xs">
                  Pick a persona above and ask anything — code, writing, strategy, or research.
                </p>
              </div>
            ) : (
              messages.map((m, i) => <ChatBubble key={i} {...m} />)
            )}
          </div>

          {/* Input area */}
          {outOfCredits ? (
            <div className="glass-card p-5 flex items-center justify-between gap-4 border-amber-500/20">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-100">You&apos;re out of credits</p>
                  <p className="text-xs text-zinc-500">Upgrade your plan to keep chatting</p>
                </div>
              </div>
              <button onClick={() => navigate('/pricing')} className="glow-btn text-sm flex-shrink-0">
                Upgrade
              </button>
            </div>
          ) : (
            <div className="glass-card p-3 flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Message your AI assistant…"
                className="flex-1 bg-transparent resize-none outline-none text-sm text-zinc-100 placeholder-zinc-500 max-h-40 px-2 py-2"
              />
              <button
                onClick={handleSend}
                disabled={isStreaming || !input.trim()}
                className="glow-btn w-10 h-10 !p-0 flex items-center justify-center flex-shrink-0"
              >
                {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
};

export default Chat;
