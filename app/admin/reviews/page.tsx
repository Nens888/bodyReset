'use client';

import { useState, useEffect } from 'react';
import { MoreHorizontal, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type Massage = {
  id: string;
  title: string;
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

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={14}
          className={star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-neutral-300'}
          fill={star <= rating ? 'currentColor' : 'none'}
        />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/reviews');
      if (!response.ok) throw new Error('Failed to fetch reviews');
      const data = await response.json();
      setReviews(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот отзыв?')) return;

    try {
      const response = await fetch(`/api/reviews/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete review');
      fetchReviews(); // Refresh list
    } catch (error) {
      console.error(error);
      alert('Ошибка при удалении отзыва');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col sm:gap-4 sm:py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Отзывы</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Список отзывов</CardTitle>
          <CardDescription>Управление отзывами клиентов.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Вид массажа</TableHead>
                <TableHead>Оценка</TableHead>
                <TableHead className="hidden md:table-cell">Автор</TableHead>
                <TableHead className="hidden lg:table-cell">Текст</TableHead>
                <TableHead className="hidden md:table-cell">Дата</TableHead>
                <TableHead><span className="sr-only">Действия</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Загрузка...
                  </TableCell>
                </TableRow>
              ) : reviews.length > 0 ? (
                reviews.map((review) => {
                  const massage = review.massage;
                  return (
                    <TableRow key={review.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{massage?.title || 'Не указан'}</div>
                          {massage?.zones && massage.zones.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {massage.zones.slice(0, 3).map((zone) => (
                                <span
                                  key={zone}
                                  className="px-1.5 py-0.5 bg-neutral-100 text-neutral-600 rounded text-xs"
                                >
                                  {zoneLabels[zone] || zone}
                                </span>
                              ))}
                              {massage.zones.length > 3 && (
                                <span className="px-1.5 py-0.5 text-neutral-500 text-xs">
                                  +{massage.zones.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StarRating rating={review.rating} />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {review.author_name || 'Аноним'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell max-w-md">
                        <p className="truncate text-sm text-neutral-600">
                          {review.text}
                        </p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-neutral-500">
                        {formatDate(review.created_at)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Действия</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => handleDelete(review.id)}
                              className="text-red-600"
                            >
                              Удалить
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Пока нет отзывов.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}



