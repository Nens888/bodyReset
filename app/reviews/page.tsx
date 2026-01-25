'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Star } from 'lucide-react';
import { ChatWidget } from '@/components/ChatWidget';

type Massage = {
  id: string;
  title: string;
  description: string;
  duration: number;
  price: number;
  original_price?: number | null;
  zones?: string[] | null;
};

type Review = {
  id: string;
  massage_id: string;
  rating: number;
  text: string;
  author_name?: string | null;
  created_at: string;
  massage?: Massage | null;
};

const zoneLabels: { [key: string]: string } = {
  'head': 'Голова',
  'neck': 'Шея',
  'shoulders': 'Плечи',
  'back': 'Спина',
  'arms': 'Руки',
  'hands': 'Кисти',
  'legs': 'Ноги',
  'feet': 'Стопы',
  'abdomen': 'Живот',
  'chest': 'Грудь',
  'full_body': 'Все тело',
};

function StarRating({ rating, onRatingChange, interactive = false }: { rating: number; onRatingChange?: (rating: number) => void; interactive?: boolean }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => interactive && onRatingChange && onRatingChange(star)}
          disabled={!interactive}
          className={`
            ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}
            ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-neutral-300'}
          `}
        >
          <Star size={24} fill={star <= rating ? 'currentColor' : 'none'} />
        </button>
      ))}
    </div>
  );
}

function ReviewFormDialog({ massages, onFormSubmit, children }: { massages: Massage[]; onFormSubmit: () => void; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [massageId, setMassageId] = useState('');
  const [text, setText] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setRating(0);
      setMassageId('');
      setText('');
      setAuthorName('');
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rating || !massageId || !text.trim()) {
      alert('Пожалуйста, заполните все обязательные поля');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          massage_id: massageId,
          rating,
          text: text.trim(),
          author_name: authorName.trim() || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Не удалось создать отзыв');
      }

      onFormSubmit();
      setOpen(false);
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Произошла ошибка при создании отзыва');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Оставить отзыв</DialogTitle>
          <DialogDescription>
            Поделитесь своим опытом и помогите другим сделать правильный выбор.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="massage">Вид массажа *</Label>
            <Select value={massageId} onValueChange={setMassageId}>
              <SelectTrigger id="massage">
                <SelectValue placeholder="Выберите вид массажа" />
              </SelectTrigger>
              <SelectContent>
                {massages.map((massage) => (
                  <SelectItem key={massage.id} value={massage.id}>
                    {massage.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Оценка *</Label>
            <StarRating rating={rating} onRatingChange={setRating} interactive />
            {rating > 0 && <p className="text-xs text-neutral-500">Выбрано: {rating} из 5</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="text">Текст отзыва *</Label>
            <Textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Расскажите о вашем опыте..."
              rows={5}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="authorName">Ваше имя (необязательно)</Label>
            <input
              id="authorName"
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Как к вам обращаться?"
              className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Отправка...' : 'Отправить отзыв'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [massages, setMassages] = useState<Massage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/reviews');
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMassages = async () => {
    try {
      const response = await fetch('/api/massages');
      if (response.ok) {
        const data = await response.json();
        setMassages(data);
      }
    } catch (error) {
      console.error('Failed to fetch massages:', error);
    }
  };

  useEffect(() => {
    fetchReviews();
    fetchMassages();
  }, []);

  return (
    <main className="min-h-screen bg-white text-neutral-900">
      <header className="sticky top-0 z-50 border-b border-neutral-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5">
          <h1 className="text-lg font-semibold tracking-tight">
            Body <span className="text-violet-500">Reset</span>
          </h1>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-8 py-20">
        <div className="mb-16 flex items-center justify-between">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-semibold tracking-tight">
              Отзывы
            </h1>
            <p className="mt-4 text-lg text-neutral-500">
              Читайте отзывы наших клиентов и делитесь своим опытом.
            </p>
          </div>
          <ReviewFormDialog massages={massages} onFormSubmit={fetchReviews}>
            <Button className="rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white hover:bg-neutral-800 transition">
              Оставить отзыв
            </Button>
          </ReviewFormDialog>
        </div>

        {loading ? (
          <div className="text-center py-20 text-neutral-500">Загрузка отзывов...</div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-neutral-500 text-lg">Пока нет отзывов. Будьте первым!</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {reviews.map((review) => {
              const massage = review.massage || massages.find(m => m.id === review.massage_id);
              
              return (
                <div
                  key={review.id}
                  className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <StarRating rating={review.rating} />
                        {review.author_name && (
                          <span className="text-sm font-medium text-neutral-700">
                            {review.author_name}
                          </span>
                        )}
                      </div>
                      {massage && (
                        <div className="mt-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-semibold text-neutral-900">
                              {massage.title}
                            </span>
                          </div>
                          {massage.zones && massage.zones.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {massage.zones.map((zone) => (
                                <span
                                  key={zone}
                                  className="px-2.5 py-1 bg-neutral-100 text-neutral-700 rounded-full text-xs font-medium"
                                >
                                  {zoneLabels[zone] || zone}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-neutral-400 ml-4">
                      {new Date(review.created_at).toLocaleDateString('ru-RU', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <p className="text-neutral-700 leading-relaxed whitespace-pre-wrap">
                    {review.text}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <footer className="border-t border-neutral-100 py-10 text-sm text-neutral-400">
        <div className="mx-auto max-w-7xl px-8">
          © {new Date().getFullYear()} Body Reset
        </div>
      </footer>

      <ChatWidget />
    </main>
  );
}

