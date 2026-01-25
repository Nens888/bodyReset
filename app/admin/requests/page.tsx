'use client';

import { useState, useEffect } from 'react';
import { MoreHorizontal } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

type Booking = {
  id: string;
  massages: { title: string } | null;
  date: string;
  time: string;
  contact: string;
  status: 'new' | 'confirmed' | 'canceled' | 'completed';
};

const statusMap = {
  new: 'Новая',
  confirmed: 'Подтверждена',
  canceled: 'Отменена',
  completed: 'Завершена',
};

const statusVariantMap: { [key in Booking['status']]: 'secondary' | 'default' | 'destructive' | 'outline' } = {
  new: 'secondary',
  confirmed: 'default',
  canceled: 'destructive',
  completed: 'outline',
};

function BookingsTable({ 
    bookings, 
    onUpdate,
    onDelete,
}: { 
    bookings: Booking[],
    onUpdate: (id: string, status: Booking['status']) => void,
    onDelete: (id: string) => void,
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Массаж</TableHead>
          <TableHead>Статус</TableHead>
          <TableHead className="hidden md:table-cell">Дата и время</TableHead>
          <TableHead className="hidden md:table-cell">Контакт</TableHead>
          <TableHead>
            <span className="sr-only">Действия</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.length > 0 ? bookings.map((booking) => (
          <TableRow key={booking.id}>
            <TableCell className="font-medium">
              {booking.massages?.title || 'Не указан'}
            </TableCell>
            <TableCell>
              <Badge variant={statusVariantMap[booking.status]}>
                {statusMap[booking.status]}
              </Badge>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              {booking.date}, {booking.time}
            </TableCell>
            <TableCell className="hidden md:table-cell">
              {booking.contact}
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
                  <DropdownMenuItem onClick={() => onUpdate(booking.id, 'confirmed')}>Подтвердить</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onUpdate(booking.id, 'canceled')}>Отменить</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onUpdate(booking.id, 'completed')}>Завершить</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete(booking.id)}>Удалить</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        )) : (
            <TableRow>
                <TableCell colSpan={5} className="text-center">Нет заявок с таким статусом.</TableCell>
            </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

export default function RequestsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  
  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/bookings', {
        method: 'GET',
        credentials: 'include', // Ensure cookies are sent
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        if (response.status === 401) {
          // Redirect to login if unauthorized
          window.location.href = '/admin/login';
          return;
        }
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch bookings' }));
        throw new Error(errorData.error || 'Failed to fetch bookings');
      }
      const data = await response.json();
      setBookings(data);
    } catch (error) {
      console.error(error);
      // Don't show error if redirecting to login
      if (error instanceof Error && error.message.includes('401')) {
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleUpdateStatus = async (id: string, status: Booking['status']) => {
    try {
        const response = await fetch(`/api/bookings/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        });
        if (!response.ok) throw new Error('Failed to update status');
        fetchBookings();
    } catch (error) {
        console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту заявку?')) return;
    try {
        const response = await fetch(`/api/bookings/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete booking');
        fetchBookings();
    } catch (error) {
        console.error(error);
    }
  };

  const filteredBookings = (status: Booking['status']) => {
    return bookings.filter((booking) => booking.status === status);
  };

  return (
    <Tabs defaultValue="all">
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="all">Все</TabsTrigger>
          <TabsTrigger value="new">Новые</TabsTrigger>
          <TabsTrigger value="confirmed">Подтвержденные</TabsTrigger>
          <TabsTrigger value="canceled" className="hidden sm:flex">
            Отмененные
          </TabsTrigger>
          <TabsTrigger value="completed" className="hidden sm:flex">
            Завершенные
          </TabsTrigger>
        </TabsList>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Заявки</CardTitle>
          <CardDescription>Управление записями на массаж.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="text-center p-8">Загрузка...</div>
          ) : (
            <>
              <TabsContent value="all">
                <BookingsTable bookings={bookings} onUpdate={handleUpdateStatus} onDelete={handleDelete} />
              </TabsContent>
              <TabsContent value="new">
                <BookingsTable bookings={filteredBookings('new')} onUpdate={handleUpdateStatus} onDelete={handleDelete} />
              </TabsContent>
              <TabsContent value="confirmed">
                <BookingsTable bookings={filteredBookings('confirmed')} onUpdate={handleUpdateStatus} onDelete={handleDelete} />
              </TabsContent>
              <TabsContent value="canceled">
                <BookingsTable bookings={filteredBookings('canceled')} onUpdate={handleUpdateStatus} onDelete={handleDelete} />
              </TabsContent>
              <TabsContent value="completed">
                <BookingsTable bookings={filteredBookings('completed')} onUpdate={handleUpdateStatus} onDelete={handleDelete} />
              </TabsContent>
            </>
          )}
        </CardContent>
      </Card>
    </Tabs>
  );
}
