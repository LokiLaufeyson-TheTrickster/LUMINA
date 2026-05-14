'use client';

import { useState, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/db';
import type { ChatMessage } from '@/lib/db';
import { callLLM, callLLMStream, buildChatPrompt, getAIConfig } from '@/lib/ai';
import AppShell from '@/components/AppShell';
import { MessageCircle, Send, Sparkles, AlertCircle, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';

export default function ChatPage() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const messages = useLiveQuery(
    () => db.chatMessages.orderBy('createdAt').toArray(),
    []
  );

  const entries = useLiveQuery(
    () => db.entries.orderBy('createdAt').reverse().toArray(),
    []
  );

  const hasApiKey = typeof window !== 'undefined' && !!getAIConfig()?.apiKey;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const question = input.trim();
    setInput('');
    setError(null);
    setStreamingMessage('');

    // Save user message
    await db.chatMessages.add({
      role: 'user',
      content: question,
      createdAt: new Date(),
    });

    setLoading(true);

    try {
      // Simple keyword search for relevant entries
      const allEntries = entries || [];
      const keywords = question.toLowerCase().split(/\s+/);
      const relevant = allEntries
        .filter(e =>
          keywords.some(k =>
            e.content.toLowerCase().includes(k) ||
            e.title.toLowerCase().includes(k) ||
            e.tags.some(t => t.toLowerCase().includes(k))
          )
        )
        .slice(0, 10);

      // If no keyword matches, use most recent entries
      const contextEntries = relevant.length > 0 ? relevant : allEntries.slice(0, 10);

      const prompt = buildChatPrompt(question, contextEntries);
      
      let fullResponse = '';
      await callLLMStream(prompt, (chunk) => {
        fullResponse += chunk;
        setStreamingMessage(fullResponse);
      });

      await db.chatMessages.add({
        role: 'assistant',
        content: fullResponse,
        createdAt: new Date(),
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      setError(errorMessage);

      // Save error as assistant message
      await db.chatMessages.add({
        role: 'assistant',
        content: `I'm having trouble connecting right now. ${errorMessage}`,
        createdAt: new Date(),
      });
    }

    setLoading(false);
    setStreamingMessage('');
    inputRef.current?.focus();
  };

  const handleClearClick = () => setShowConfirmClear(true);

  const confirmClearChat = async () => {
    await db.chatMessages.clear();
    setShowConfirmClear(false);
  };

  const suggestedQuestions = [
    "When was I happiest?",
    "What usually stresses me out?",
    "What patterns happen before burnout?",
    "What makes me feel most creative?",
    "How has my mood changed recently?",
  ];

  return (
    <AppShell>
      <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)' }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--neutral-700)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
                <MessageCircle size={24} style={{ color: 'var(--pink-300)' }} />
                Chat with Your Past
              </h1>
              <p style={{ fontSize: 14, color: 'var(--neutral-400)', marginBottom: 20 }}>
                Ask questions about your journal entries
              </p>
            </div>
            {messages && messages.length > 0 && (
              <button className="btn-ghost" onClick={handleClearClick} style={{ color: 'var(--neutral-400)' }}>
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </motion.div>

        {/* API Key Warning */}
        {!hasApiKey && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card-static"
            style={{
              padding: 16,
              marginBottom: 16,
              background: 'linear-gradient(135deg, rgba(255,213,128,0.1), rgba(244,160,181,0.05))',
              border: '1px solid rgba(255,213,128,0.2)',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={16} style={{ color: 'var(--gold-300)' }} />
              <span style={{ fontSize: 13, color: 'var(--neutral-600)' }}>
                Set up your OpenRouter API key in{' '}
                <button onClick={() => router.push('/settings')} style={{ color: 'var(--pink-400)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 13 }}>
                  Settings
                </button>{' '}
                to enable AI chat.
              </span>
            </div>
          </motion.div>
        )}

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 16 }}>
          {(!messages || messages.length === 0) ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>💭</div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--neutral-600)', marginBottom: 8 }}>
                Ask me anything about your journey
              </h3>
              <p style={{ fontSize: 13, color: 'var(--neutral-400)', marginBottom: 24 }}>
                I&apos;ll search through your entries to find answers
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 300, margin: '0 auto' }}>
                {suggestedQuestions.map(q => (
                  <button
                    key={q}
                    onClick={() => { setInput(q); inputRef.current?.focus(); }}
                    className="glass-card"
                    style={{
                      padding: '10px 16px',
                      fontSize: 13,
                      color: 'var(--neutral-600)',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    &ldquo;{q}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {messages.map((msg, i) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div style={{
                    maxWidth: '80%',
                    padding: '12px 16px',
                    borderRadius: msg.role === 'user'
                      ? '16px 16px 4px 16px'
                      : '16px 16px 16px 4px',
                    background: msg.role === 'user'
                      ? 'linear-gradient(135deg, var(--pink-300), var(--lavender-400))'
                      : 'var(--glass-bg)',
                    color: msg.role === 'user' ? 'white' : 'var(--neutral-700)',
                    border: msg.role === 'user' ? 'none' : '1px solid var(--glass-border)',
                    fontSize: 14,
                    lineHeight: 1.6,
                    fontFamily: msg.role === 'assistant' ? 'var(--font-journal)' : 'var(--font-body)',
                  }}>
                    {msg.role === 'assistant' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6, fontSize: 10, color: 'var(--lavender-400)', fontWeight: 600, fontFamily: 'var(--font-body)' }}>
                        <Sparkles size={10} /> LUMINA
                      </div>
                    )}
                    <div style={{ wordBreak: 'break-word' }}>
                      {msg.role === 'assistant' ? (
                        <ReactMarkdown 
                          components={{
                            p: ({node, ...props}) => <p style={{ margin: '8px 0' }} {...props} />,
                            li: ({node, ...props}) => <li style={{ marginLeft: 16, marginBottom: 4 }} {...props} />,
                            ul: ({node, ...props}) => <ul style={{ margin: '8px 0' }} {...props} />,
                            code: ({node, ...props}) => <code style={{ background: 'rgba(0,0,0,0.05)', padding: '2px 4px', borderRadius: 4, fontFamily: 'monospace' }} {...props} />
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      ) : msg.content}
                    </div>
                  </div>
                </motion.div>
              ))}
              {streamingMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', justifyContent: 'flex-start' }}
                >
                  <div style={{
                    maxWidth: '80%',
                    padding: '12px 16px',
                    borderRadius: '16px 16px 16px 4px',
                    background: 'var(--glass-bg)',
                    color: 'var(--neutral-700)',
                    border: '1px solid var(--glass-border)',
                    fontSize: 14,
                    lineHeight: 1.6,
                    fontFamily: 'var(--font-journal)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6, fontSize: 10, color: 'var(--lavender-400)', fontWeight: 600, fontFamily: 'var(--font-body)' }}>
                      <Sparkles size={10} /> LUMINA
                    </div>
                    <div style={{ wordBreak: 'break-word' }}>
                      <ReactMarkdown 
                        components={{
                          p: ({node, ...props}) => <p style={{ margin: '8px 0' }} {...props} />,
                          li: ({node, ...props}) => <li style={{ marginLeft: 16, marginBottom: 4 }} {...props} />,
                          ul: ({node, ...props}) => <ul style={{ margin: '8px 0' }} {...props} />,
                          code: ({node, ...props}) => <code style={{ background: 'rgba(0,0,0,0.05)', padding: '2px 4px', borderRadius: 4, fontFamily: 'monospace' }} {...props} />
                        }}
                      >
                        {streamingMessage}
                      </ReactMarkdown>
                    </div>
                  </div>
                </motion.div>
              )}
              {loading && !streamingMessage && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex' }}>
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '16px 16px 16px 4px',
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--glass-border)',
                  }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          animate={{ y: [-2, 2, -2] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: 'var(--lavender-300)',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Custom Delete Confirm Modal */}
        {showConfirmClear && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(4px)',
            padding: 24,
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                background: 'var(--background)',
                borderRadius: 'var(--radius-lg)',
                padding: 24,
                width: '100%',
                maxWidth: 400,
                boxShadow: 'var(--glass-shadow)',
              }}
            >
              <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--neutral-700)', marginBottom: 12 }}>
                Clear chat history?
              </h3>
              <p style={{ fontSize: 14, color: 'var(--neutral-500)', marginBottom: 24, lineHeight: 1.5 }}>
                Are you sure you want to delete all messages? This cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  className="btn-ghost"
                  onClick={() => setShowConfirmClear(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={confirmClearChat}
                  style={{ background: 'var(--pink-500)', color: 'white', border: 'none' }}
                >
                  Clear
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Input */}
        <div style={{
          flexShrink: 0,
          display: 'flex',
          gap: 10,
          padding: '12px 0',
          borderTop: '1px solid var(--glass-border)',
        }}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask about your past..."
            className="input"
            style={{ flex: 1 }}
          />
          <motion.button
            className="btn-primary"
            onClick={handleSend}
            disabled={!input.trim() || loading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              opacity: input.trim() ? 1 : 0.5,
            }}
          >
            <Send size={16} />
          </motion.button>
        </div>
      </div>
    </AppShell>
  );
}
