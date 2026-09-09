import { useState } from 'react';
import { MessageSquarePlus, MessageSquare, Pencil, Trash2, Check, X, History } from 'lucide-react';
import { useChatContext } from '../context/ChatContext';
import SkeletonLoader from './SkeletonLoader';

/**
 * Persistent chat-history sidebar for the AI Chat page. Lists the user's
 * saved conversations, and supports switching, renaming, and deleting them.
 * Rendered inline on desktop; toggled as a slide-over panel on mobile via
 * the `open`/`onClose` props.
 */
const ChatSidebar = ({ open, onClose, onSelectConversation, onNewChat }) => {
  const {
    conversations,
    conversationsLoading,
    conversationsError,
    activeConversationId,
    fetchConversations,
    renameConversation,
    removeConversation,
  } = useChatContext();

  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  const startRename = (conversation) => {
    setEditingId(conversation._id);
    setEditValue(conversation.title);
  };

  const cancelRename = () => {
    setEditingId(null);
    setEditValue('');
  };

  const confirmRename = async (id) => {
    if (!editValue.trim()) return cancelRename();
    try {
      await renameConversation(id, editValue.trim());
    } finally {
      cancelRename();
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this conversation? This cannot be undone.')) return;
    await removeConversation(id);
  };

  const content = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-white/[0.06]">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Chat History</span>
        {onClose && (
          <button onClick={onClose} className="lg:hidden text-zinc-500 hover:text-zinc-200">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="p-3">
        <button
          onClick={onNewChat}
          className="ghost-btn w-full flex items-center justify-center gap-2 text-sm"
        >
          <MessageSquarePlus className="w-4 h-4" /> New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1">
        {conversationsLoading ? (
          <div className="px-1">
            <SkeletonLoader variant="row" count={4} />
          </div>
        ) : conversationsError ? (
          <div className="text-center py-8 px-3">
            <p className="text-xs text-red-400 mb-2">{conversationsError}</p>
            <button onClick={fetchConversations} className="text-xs text-accent-violet hover:underline">
              Try again
            </button>
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-10 px-4">
            <History className="w-6 h-6 text-zinc-600 mx-auto mb-2" />
            <p className="text-xs text-zinc-500">No conversations yet. Start a new chat.</p>
          </div>
        ) : (
          conversations.map((c) => (
            <div
              key={c._id}
              onClick={() => editingId !== c._id && onSelectConversation(c._id)}
              className={`group relative rounded-xl px-3 py-2.5 cursor-pointer transition-colors duration-150 ${
                activeConversationId === c._id ? 'bg-white/[0.08]' : 'hover:bg-white/[0.04]'
              }`}
            >
              {editingId === c._id ? (
                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <input
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') confirmRename(c._id);
                      if (e.key === 'Escape') cancelRename();
                    }}
                    className="flex-1 bg-base-900 border border-white/[0.1] rounded-lg px-2 py-1 text-xs text-zinc-100 outline-none focus:border-accent-violet/60"
                  />
                  <button onClick={() => confirmRename(c._id)} className="text-accent-emerald flex-shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={cancelRename} className="text-zinc-500 flex-shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                  <span className="flex-1 text-sm text-zinc-200 truncate">{c.title}</span>
                  <div className="hidden group-hover:flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startRename(c);
                      }}
                      className="text-zinc-500 hover:text-zinc-200 p-1"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, c._id)}
                      className="text-zinc-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: static column */}
      <aside className="hidden lg:block w-64 flex-shrink-0 glass-card mr-4 overflow-hidden">
        {content}
      </aside>

      {/* Mobile: slide-over panel */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <div className="relative w-72 max-w-[80vw] bg-base-900 border-r border-white/[0.08] animate-fadeUp">
            {content}
          </div>
        </div>
      )}
    </>
  );
};

export default ChatSidebar;
