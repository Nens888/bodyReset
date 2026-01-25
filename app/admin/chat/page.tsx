'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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

type QuickReply = {
  id: string;
  text: string;
  order_index: number;
};

type Conversation = {
  chat_id: string;
  last_message_at: string | null;
  unread_count: number;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [adminName, setAdminName] = useState('Администратор');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeChatIdRef = useRef<string | null>(null);

  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    fetchConversations();
    fetchQuickReplies();
    fetchAdminProfile();

    // Subscribe to new messages
    const channel = supabase
      .channel('admin-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const msg = payload.new as any;
          const chatId = msg?.chat_id as string | undefined;
          if (!chatId) return;

          const currentActiveChatId = activeChatIdRef.current;

          setConversations((prev) => {
            const existing = prev.find((c) => c.chat_id === chatId);
            const unreadInc = msg.sender_type === 'user' && !msg.is_read ? 1 : 0;

            if (!existing) {
              return [{ chat_id: chatId, last_message_at: msg.created_at || null, unread_count: unreadInc }, ...prev];
            }

            return prev
              .map((c) =>
                c.chat_id === chatId
                  ? {
                      ...c,
                      last_message_at: msg.created_at || c.last_message_at,
                      unread_count: currentActiveChatId === chatId ? c.unread_count : c.unread_count + unreadInc,
                    }
                  : c
              )
              .sort((a, b) => {
                const ad = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
                const bd = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
                return bd - ad;
              });
          });

          if (currentActiveChatId && chatId === currentActiveChatId) {
            setMessages((prev) => [...prev, msg as Message]);
            scrollToBottom();

            if (msg.sender_type === 'user' && !msg.is_read) {
              markAsRead(msg.id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!activeChatId) return;
    fetchMessages(activeChatId);
  }, [activeChatId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/chat/conversations', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
        if (!activeChatId && Array.isArray(data) && data.length > 0) {
          setActiveChatId(data[0].chat_id);
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chat/messages?chat_id=${encodeURIComponent(chatId)}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
        data.forEach((msg: Message) => {
          if (!msg.is_read && msg.sender_type === 'user') {
            markAsRead(msg.id);
          }
        });
        setConversations((prev) => prev.map((c) => (c.chat_id === chatId ? { ...c, unread_count: 0 } : c)));
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchQuickReplies = async () => {
    try {
      const response = await fetch('/api/chat/quick-replies', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setQuickReplies(data.sort((a: QuickReply, b: QuickReply) => a.order_index - b.order_index));
      }
    } catch (error) {
      console.error('Error fetching quick replies:', error);
    }
  };

  const fetchAdminProfile = async () => {
    try {
      const response = await fetch('/api/chat/admin-profile', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        if (data.display_name) {
          setAdminName(data.display_name);
        }
      }
    } catch (error) {
      console.error('Error fetching admin profile:', error);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      await fetch(`/api/chat/messages/${messageId}`, {
        method: 'PATCH',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;
    if (!activeChatId) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const senderId = user?.id || null;

      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          message: messageText.trim(),
          sender_type: 'admin',
          sender_id: senderId,
          chat_id: activeChatId,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage(newMessage);
  };

  const handleQuickReply = (text: string) => {
    if (!activeChatId) return;
    sendMessage(text);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Сегодня';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Вчера';
    } else {
      return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    }
  };

  const unreadCount = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold md:text-2xl">Чат с клиентами</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {unreadCount > 0 && (
              <span className="text-red-600 font-medium">{unreadCount} непрочитанных</span>
            )}
            {unreadCount === 0 && 'Нет непрочитанных сообщений'}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[260px_1fr_300px]">
        {/* Conversations */}
        <Card className="bg-white rounded-xl shadow-md border-0 h-fit">
          <CardHeader className="border-b border-neutral-100 pb-4">
            <CardTitle className="text-lg font-semibold">Диалоги</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            {conversations.length === 0 ? (
              <p className="text-sm text-neutral-500 text-center py-4">Нет диалогов</p>
            ) : (
              <div className="space-y-1">
                {conversations.map((c) => (
                  <Button
                    key={c.chat_id}
                    variant="outline"
                    className={`w-full justify-between ${
                      activeChatId === c.chat_id
                        ? 'border-violet-600 bg-violet-50 text-violet-900'
                        : 'border-neutral-200'
                    }`}
                    onClick={() => setActiveChatId(c.chat_id)}
                  >
                    <span className="truncate max-w-[150px]">{c.chat_id}</span>
                    {c.unread_count > 0 && (
                      <span className="ml-2 text-xs bg-red-600 text-white rounded-full px-2 py-0.5">
                        {c.unread_count}
                      </span>
                    )}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat Messages */}
        <Card className="bg-white rounded-xl shadow-md border-0">
          <CardHeader className="border-b border-neutral-100 pb-4">
            <CardTitle className="text-lg font-semibold">Сообщения</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[600px] flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {!activeChatId ? (
                  <div className="text-center text-neutral-500 py-12">
                    <p>Выберите диалог</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-neutral-500 py-12">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
                    <p>Нет сообщений</p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const showDate =
                      index === 0 ||
                      new Date(msg.created_at).toDateString() !==
                        new Date(messages[index - 1].created_at).toDateString();

                    return (
                      <div key={msg.id}>
                        {showDate && (
                          <div className="text-center text-xs text-neutral-400 my-4">
                            {formatDate(msg.created_at)}
                          </div>
                        )}
                        <div
                          className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                              msg.sender_type === 'admin'
                                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white'
                                : 'bg-neutral-100 text-neutral-900'
                            }`}
                          >
                            {msg.sender_type === 'user' && (
                              <p className="text-xs text-neutral-500 mb-1">Клиент</p>
                            )}
                            {msg.sender_type === 'admin' && (
                              <p className="text-xs text-violet-100 mb-1 font-medium">
                                {msg.admin_name || adminName}
                              </p>
                            )}
                            <p className="text-sm">{msg.message}</p>
                            <p
                              className={`text-xs mt-1.5 ${
                                msg.sender_type === 'admin' ? 'text-violet-100' : 'text-neutral-500'
                              }`}
                            >
                              {formatTime(msg.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSubmit} className="p-4 border-t border-neutral-200">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Напишите сообщение..."
                    className="flex-1 rounded-lg"
                    disabled={loading}
                  />
                  <Button
                    type="submit"
                    disabled={loading || !newMessage.trim()}
                    className="rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>

        {/* Quick Replies */}
        <Card className="bg-white rounded-xl shadow-md border-0 h-fit">
          <CardHeader className="border-b border-neutral-100 pb-4">
            <CardTitle className="text-lg font-semibold">Быстрые ответы</CardTitle>
            <CardDescription className="text-sm">
              Нажмите на ответ, чтобы отправить
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            {quickReplies.length === 0 ? (
              <p className="text-sm text-neutral-500 text-center py-4">
                Нет быстрых ответов. Добавьте их в настройках.
              </p>
            ) : (
              <div className="space-y-2">
                {quickReplies.map((reply) => (
                  <Button
                    key={reply.id}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-2 px-3 text-sm whitespace-normal"
                    onClick={() => handleQuickReply(reply.text)}
                  >
                    {reply.text}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

