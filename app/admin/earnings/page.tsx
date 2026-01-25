'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, TrendingDown, Trash2 } from 'lucide-react';

type MonthlyEarning = {
  month: string;
  year: number;
  monthNumber: number;
  earnings: number;
  bookingsCount: number;
};

export default function EarningsPage() {
  const router = useRouter();
  const [monthlyEarnings, setMonthlyEarnings] = useState<MonthlyEarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState<string | null>(null);

  const fetchEarnings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/bookings', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch bookings');
      const bookings = await response.json();

      // Filter only confirmed/completed bookings
      const confirmedBookings = bookings.filter(
        (b: any) => b.status === 'confirmed' || b.status === 'completed'
      );

      // Group by month and year
      const monthlyData: { [key: string]: { earnings: number; count: number } } = {};

      confirmedBookings.forEach((booking: any) => {
        if (!booking.massages) return;

        const date = new Date(booking.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        // Calculate effective price from massages relation
        const massage = booking.massages;
        const effectivePrice =
          massage.original_price &&
          massage.original_price > massage.price
            ? massage.price
            : massage.original_price || massage.price;

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { earnings: 0, count: 0 };
        }

        monthlyData[monthKey].earnings += effectivePrice;
        monthlyData[monthKey].count += 1;
      });

      // Convert to array and format
      const monthNames = [
        'Январь',
        'Февраль',
        'Март',
        'Апрель',
        'Май',
        'Июнь',
        'Июль',
        'Август',
        'Сентябрь',
        'Октябрь',
        'Ноябрь',
        'Декабрь',
      ];

      const result: MonthlyEarning[] = Object.entries(monthlyData)
        .map(([key, data]) => {
          const [year, month] = key.split('-');
          return {
            month: monthNames[parseInt(month) - 1],
            year: parseInt(year),
            monthNumber: parseInt(month),
            earnings: data.earnings,
            bookingsCount: data.count,
          };
        })
        .sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          return b.monthNumber - a.monthNumber;
        });

      setMonthlyEarnings(result);
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, []);

  const handleClearEarnings = async (year: number, month: number) => {
    if (!confirm(`Вы уверены, что хотите очистить заработок за ${month}/${year}? Это действие нельзя отменить.`)) {
      return;
    }

    const key = `${year}-${month}`;
    setClearing(key);

    try {
      const response = await fetch('/api/earnings/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ year, month }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to clear earnings');
      }

      // Refresh earnings and dashboard
      await fetchEarnings();
      router.refresh(); // Refresh dashboard if on same page
      
      alert('Заработок успешно очищен');
    } catch (error: any) {
      console.error('Error clearing earnings:', error);
      alert(`Ошибка: ${error.message}`);
    } finally {
      setClearing(null);
    }
  };

  const totalEarnings = monthlyEarnings.reduce((sum, month) => sum + month.earnings, 0);
  const averageEarnings =
    monthlyEarnings.length > 0 ? totalEarnings / monthlyEarnings.length : 0;
  const currentMonthEarnings = monthlyEarnings.length > 0 ? monthlyEarnings[0].earnings : 0;
  const previousMonthEarnings = monthlyEarnings.length > 1 ? monthlyEarnings[1].earnings : 0;
  const growth =
    previousMonthEarnings > 0
      ? ((currentMonthEarnings - previousMonthEarnings) / previousMonthEarnings) * 100
      : 0;

  const isCurrentMonth = (year: number, month: number) => {
    const now = new Date();
    return now.getFullYear() === year && now.getMonth() + 1 === month;
  };

  return (
    <>
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card className="bg-white rounded-xl shadow-md border-0 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600">
              Общий заработок
            </CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 shadow-sm">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-neutral-900">
              {totalEarnings.toLocaleString('ru-RU')} ₽
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl shadow-md border-0 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600">
              Средний за месяц
            </CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-sm">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-neutral-900">
              {Math.round(averageEarnings).toLocaleString('ru-RU')} ₽
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl shadow-md border-0 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600">
              Текущий месяц
            </CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 shadow-sm">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-neutral-900">
              {currentMonthEarnings.toLocaleString('ru-RU')} ₽
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl shadow-md border-0 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600">
              Рост к прошлому месяцу
            </CardTitle>
            <div
              className={`p-2 rounded-lg bg-gradient-to-br ${
                growth >= 0 ? 'from-emerald-500 to-teal-500' : 'from-rose-500 to-pink-500'
              } shadow-sm`}
            >
              {growth >= 0 ? (
                <TrendingUp className="h-4 w-4 text-white" />
              ) : (
                <TrendingDown className="h-4 w-4 text-white" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`text-3xl font-bold ${growth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}
            >
              {growth >= 0 ? '+' : ''}
              {growth.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Earnings Table */}
      <Card className="bg-white rounded-xl shadow-md border-0">
        <CardHeader className="border-b border-neutral-100 pb-4">
          <CardTitle className="text-xl font-semibold">Заработок по месяцам</CardTitle>
          <CardDescription className="text-sm">
            Детальная статистика заработка за каждый месяц
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {loading ? (
            <div className="text-center py-12 text-neutral-500">Загрузка...</div>
          ) : monthlyEarnings.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-neutral-700">Месяц</TableHead>
                  <TableHead className="font-semibold text-neutral-700 text-right">
                    Количество заявок
                  </TableHead>
                  <TableHead className="font-semibold text-neutral-700 text-right">
                    Заработок
                  </TableHead>
                  <TableHead className="font-semibold text-neutral-700 text-right">
                    Действия
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyEarnings.map((month) => {
                  const key = `${month.year}-${month.monthNumber}`;
                  const isClearingThis = clearing === key;
                  const isCurrent = isCurrentMonth(month.year, month.monthNumber);

                  return (
                    <TableRow
                      key={key}
                      className="hover:bg-neutral-50/50 transition-colors"
                    >
                      <TableCell className="py-4">
                        <div className="font-medium text-neutral-900">
                          {month.month} {month.year}
                          {isCurrent && (
                            <span className="ml-2 text-xs text-emerald-600 font-medium">
                              (текущий)
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-neutral-600 py-4">
                        {month.bookingsCount}
                      </TableCell>
                      <TableCell className="text-right py-4">
                        <div className="font-semibold text-neutral-900 text-lg">
                          {month.earnings.toLocaleString('ru-RU')} ₽
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleClearEarnings(month.year, month.monthNumber)}
                          disabled={isClearingThis}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        >
                          {isClearingThis ? (
                            'Очистка...'
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-1" />
                              Очистить
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-neutral-500">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
              <p className="text-lg">Нет данных о заработке</p>
              <p className="text-sm mt-2">Заработок появится после подтверждения заявок</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
