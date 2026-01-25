'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type Message = {
  id: string;
  sender_type: 'user' | 'admin';
  sender_id: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
  admin_name?: string | null;
};

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => {
    // Get or create session ID from localStorage
    if (typeof window !== 'undefined') {
      let id = localStorage.getItem('chat_session_id');
      if (!id) {
        id = `user-${Math.random().toString(36).substring(2, 9)}-${Date.now()}`;
        localStorage.setItem('chat_session_id', id);
      }
      return id;
    }
    return '';
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    if (!isOpen) return;

    // Fetch initial messages
    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const msg = payload.new as any;
          if (msg?.chat_id !== sessionId) return;
          setMessages((prev) => [...prev, msg as Message]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/chat/messages?chat_id=${encodeURIComponent(sessionId)}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          message: newMessage.trim(),
          sender_type: 'user',
          sender_id: sessionId,
          chat_id: sessionId,
        }),
      });

      if (response.ok) {
        setNewMessage('');
      } else {
        alert('Ошибка при отправке сообщения');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Ошибка при отправке сообщения');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-neutral-200 flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-neutral-200 bg-gradient-to-r from-violet-50 to-indigo-50 rounded-t-2xl">
            <h3 className="font-semibold text-neutral-900">Чат с администратором</h3>
            <p className="text-xs text-neutral-500 mt-0.5">Обычно отвечаем в течение минуты</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-neutral-500 text-sm py-8">
                Начните диалог, задайте вопрос
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                      msg.sender_type === 'user'
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white'
                        : 'bg-neutral-100 text-neutral-900'
                    }`}
                  >
                    {msg.sender_type === 'admin' && msg.admin_name && (
                      <p className="text-xs text-neutral-600 mb-1 font-medium">{msg.admin_name}</p>
                    )}
                    <p className="text-sm">{msg.message}</p>
                    <p
                      className={`text-xs mt-1 ${
                        msg.sender_type === 'user' ? 'text-violet-100' : 'text-neutral-500'
                      }`}
                    >
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="p-4 border-t border-neutral-200">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Напишите сообщение..."
                className="flex-1 rounded-full"
                disabled={loading}
              />
              <Button
                type="submit"
                disabled={loading || !newMessage.trim()}
                className="rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

