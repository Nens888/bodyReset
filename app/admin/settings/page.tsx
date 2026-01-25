'use client';

import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';

type QuickReply = {
  id: string;
  text: string;
  order_index: number;
};

export default function SettingsPage() {
  const [adminName, setAdminName] = useState('');
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [newReply, setNewReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAdminProfile();
    fetchQuickReplies();
  }, []);

  const fetchAdminProfile = async () => {
    try {
      const response = await fetch('/api/chat/admin-profile', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setAdminName(data.display_name || 'Администратор');
      }
    } catch (error) {
      console.error('Error fetching admin profile:', error);
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

  const saveAdminName = async () => {
    if (!adminName.trim()) {
      alert('Имя не может быть пустым');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/chat/admin-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ display_name: adminName.trim() }),
      });

      if (response.ok) {
        alert('Имя сохранено');
      } else {
        alert('Ошибка при сохранении имени');
      }
    } catch (error) {
      console.error('Error saving admin name:', error);
      alert('Ошибка при сохранении имени');
    } finally {
      setSaving(false);
    }
  };

  const addQuickReply = async () => {
    if (!newReply.trim()) {
      alert('Текст ответа не может быть пустым');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/chat/quick-replies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          text: newReply.trim(),
          order_index: quickReplies.length,
        }),
      });

      if (response.ok) {
        setNewReply('');
        fetchQuickReplies();
      } else {
        alert('Ошибка при добавлении ответа');
      }
    } catch (error) {
      console.error('Error adding quick reply:', error);
      alert('Ошибка при добавлении ответа');
    } finally {
      setLoading(false);
    }
  };

  const deleteQuickReply = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот быстрый ответ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/chat/quick-replies/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        fetchQuickReplies();
      } else {
        alert('Ошибка при удалении ответа');
      }
    } catch (error) {
      console.error('Error deleting quick reply:', error);
      alert('Ошибка при удалении ответа');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold md:text-2xl">Настройки</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Admin Name */}
        <Card className="bg-white rounded-xl shadow-md border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Имя администратора
            </CardTitle>
            <CardDescription>
              Это имя будет отображаться в чате при общении с клиентами
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-name">Имя</Label>
              <Input
                id="admin-name"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="Введите ваше имя"
                className="rounded-lg"
              />
            </div>
            <Button
              onClick={saveAdminName}
              disabled={saving}
              className="w-full rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Сохранение...' : 'Сохранить имя'}
            </Button>
          </CardContent>
        </Card>

        {/* Quick Replies */}
        <Card className="bg-white rounded-xl shadow-md border-0">
          <CardHeader>
            <CardTitle>Быстрые ответы</CardTitle>
            <CardDescription>
              Добавьте заготовки для быстрого ответа клиентам
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-reply">Новый быстрый ответ</Label>
              <div className="flex gap-2">
                <Input
                  id="new-reply"
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                  placeholder="Введите текст ответа"
                  className="flex-1 rounded-lg"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addQuickReply();
                    }
                  }}
                />
                <Button
                  onClick={addQuickReply}
                  disabled={loading || !newReply.trim()}
                  className="rounded-lg"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {quickReplies.length === 0 ? (
                <p className="text-sm text-neutral-500 text-center py-4">
                  Нет быстрых ответов
                </p>
              ) : (
                quickReplies.map((reply) => (
                  <div
                    key={reply.id}
                    className="flex items-center gap-2 p-3 bg-neutral-50 rounded-lg"
                  >
                    <p className="flex-1 text-sm">{reply.text}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteQuickReply(reply.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}




