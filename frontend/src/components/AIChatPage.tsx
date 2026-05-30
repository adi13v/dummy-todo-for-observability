import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import type { ChatSession, ChatMessage } from '../services/api';
import { Plus, Send, Loader2, MessageSquare, Bot, User } from 'lucide-react';

export const AIChatPage: React.FC = () => {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    if (activeChatId) {
      fetchMessages(activeChatId);
    } else {
      setMessages([]);
    }
  }, [activeChatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, sendingMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChats = async () => {
    setLoadingChats(true);
    try {
      const data = await api.getChats();
      setChats(data);
      if (data.length > 0 && !activeChatId) {
        setActiveChatId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch chats', err);
    } finally {
      setLoadingChats(false);
    }
  };

  const fetchMessages = async (chatId: string) => {
    setLoadingMessages(true);
    try {
      const data = await api.getChatMessages(chatId);
      setMessages(data);
    } catch (err) {
      console.error('Failed to fetch messages', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleNewChat = async () => {
    try {
      const newChat = await api.createChat('New Chat');
      setChats([newChat, ...chats]);
      setActiveChatId(newChat.id);
    } catch (err) {
      console.error('Failed to create new chat', err);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputMessage.trim() || !activeChatId || sendingMessage) return;

    const userMessageContent = inputMessage.trim();
    setInputMessage('');
    setSendingMessage(true);

    // Optimistically add the user's message
    const tempUserMsg: ChatMessage = {
      id: Math.random().toString(),
      chatId: activeChatId,
      role: 'user',
      content: userMessageContent,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const aiResponse = await api.sendChatMessage(activeChatId, userMessageContent);
      setMessages(prev => [...prev, aiResponse]);

      // If this was the first message, update the chat title locally to match backend logic
      if (messages.length === 0) {
        setChats(prevChats => prevChats.map(c => {
          if (c.id === activeChatId) {
            const words = userMessageContent.split(' ');
            return { ...c, title: words.slice(0, 4).join(' ') + (words.length > 4 ? '...' : '') };
          }
          return c;
        }));
      }
    } catch (err) {
      console.error('Failed to send message', err);
      // Optional: Handle error state in UI
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div style={styles.container}>
      {/* Sidebar for Chat Sessions */}
      <div style={styles.chatSidebar}>
        <button style={styles.newChatBtn} onClick={handleNewChat}>
          <Plus size={16} />
          <span>New Chat</span>
        </button>

        <div style={styles.chatList}>
          {loadingChats ? (
            <div style={styles.centerContent}><Loader2 size={24} className="animate-spin text-muted" /></div>
          ) : chats.length === 0 ? (
            <div style={styles.emptySidebar}>No recent chats</div>
          ) : (
            chats.map(chat => (
              <div
                key={chat.id}
                style={{
                  ...styles.chatSidebarItem,
                  ...(activeChatId === chat.id ? styles.activeChatSidebarItem : {})
                }}
                onClick={() => setActiveChatId(chat.id)}
              >
                <MessageSquare size={16} />
                <span style={styles.chatSidebarTitle}>{chat.title}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={styles.chatMain}>
        {/* Messages */}
        <div style={styles.messagesContainer}>
          {!activeChatId ? (
            <div style={styles.centerContent}>
              <h3 style={styles.emptyTitle}>Select or create a chat to begin</h3>
            </div>
          ) : loadingMessages ? (
            <div style={styles.centerContent}><Loader2 size={32} className="animate-spin text-muted" /></div>
          ) : messages.length === 0 ? (
            <div style={styles.centerContent}>
              <Bot size={48} style={styles.emptyIcon} />
              <h3 style={styles.emptyTitle}>AI Assistant</h3>
              <p style={styles.emptySubtitle}>Ask me about your schedule, tasks, or anything else!</p>
            </div>
          ) : (
            <div style={styles.messageList}>
              {messages.map((msg, idx) => (
                <div key={idx} style={{
                  ...styles.messageWrapper,
                  ...(msg.role === 'user' ? styles.messageWrapperUser : styles.messageWrapperAi)
                }}>
                  <div style={{
                    ...styles.messageBubble,
                    ...(msg.role === 'user' ? styles.messageBubbleUser : styles.messageBubbleAi)
                  }}>
                    <div style={styles.messageHeader}>
                      {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                      <span style={styles.messageSender}>{msg.role === 'user' ? 'You' : 'AI'}</span>
                    </div>
                    <div style={styles.messageContent}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              {sendingMessage && (
                <div style={{ ...styles.messageWrapper, ...styles.messageWrapperAi }}>
                  <div style={{ ...styles.messageBubble, ...styles.messageBubbleAi }}>
                    <Loader2 size={16} className="animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div style={styles.inputArea}>
          <form style={styles.inputForm} onSubmit={handleSendMessage}>
            <textarea
              style={styles.textarea}
              placeholder="Message AI Assistant..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!activeChatId || sendingMessage}
              rows={1}
            />
            <button
              type="submit"
              style={styles.sendBtn}
              disabled={!activeChatId || !inputMessage.trim() || sendingMessage}
            >
              <Send size={18} />
            </button>
          </form>
          <div style={styles.disclaimer}>AI may produce inaccurate information about your tasks.</div>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: 'var(--bg-primary)',
  },
  chatSidebar: {
    width: '260px',
    backgroundColor: 'var(--bg-secondary)',
    borderRight: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    padding: '16px 12px',
    flexShrink: 0,
  },
  newChatBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'transparent',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    padding: '10px',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    marginBottom: '20px',
    transition: 'var(--transition-smooth)',
    justifyContent: 'center',
    fontWeight: '500',
  },
  chatList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    overflowY: 'auto',
    flexGrow: 1,
  },
  chatSidebarItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    transition: 'var(--transition-smooth)',
  },
  activeChatSidebarItem: {
    backgroundColor: 'var(--accent-light)',
    color: 'var(--text-primary)',
    border: '1px solid var(--accent-border)',
  },
  chatSidebarTitle: {
    fontSize: '0.9rem',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  emptySidebar: {
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: '0.85rem',
    marginTop: '20px',
  },
  chatMain: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  messagesContainer: {
    flexGrow: 1,
    overflowY: 'auto',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
  },
  centerContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: 'var(--text-muted)',
  },
  emptyIcon: {
    marginBottom: '16px',
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: '1.2rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: '8px',
  },
  emptySubtitle: {
    fontSize: '0.9rem',
  },
  messageList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    maxWidth: '800px',
    margin: '0 auto',
    width: '100%',
  },
  messageWrapper: {
    display: 'flex',
    width: '100%',
  },
  messageWrapperUser: {
    justifyContent: 'flex-end',
  },
  messageWrapperAi: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: '16px',
    borderRadius: 'var(--radius-lg)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  messageBubbleUser: {
    backgroundColor: 'var(--accent-light)',
    border: '1px solid var(--accent-border)',
    borderBottomRightRadius: '4px',
  },
  messageBubbleAi: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderBottomLeftRadius: '4px',
  },
  messageHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: 'var(--text-muted)',
    fontSize: '0.8rem',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  messageSender: {
    letterSpacing: '0.5px',
  },
  messageContent: {
    color: 'var(--text-primary)',
    fontSize: '0.95rem',
    lineHeight: '1.5',
    whiteSpace: 'pre-wrap',
  },
  inputArea: {
    padding: '20px 24px',
    borderTop: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-primary)',
  },
  inputForm: {
    maxWidth: '800px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'flex-end',
    gap: '12px',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    padding: '8px 12px',
  },
  textarea: {
    flexGrow: 1,
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--text-primary)',
    fontSize: '0.95rem',
    padding: '8px',
    resize: 'none',
    maxHeight: '150px',
    outline: 'none',
  },
  sendBtn: {
    backgroundColor: 'var(--accent)',
    color: '#fff',
    border: 'none',
    width: '36px',
    height: '36px',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    marginBottom: '4px',
  },
  disclaimer: {
    textAlign: 'center',
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: '12px',
  }
};
