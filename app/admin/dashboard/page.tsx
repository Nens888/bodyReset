import { OnlineUsersBadge } from '@/components/OnlineUsersBadge';
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import Link from 'next/link';
import {
  Activity,
  FileText,
  CheckCircle,
  XCircle,
  DollarSign, // New icon for earnings
} from 'lucide-react';
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
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { type SupabaseClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation'; // Import redirect

type RecentBooking = {
    id: string;
    created_at: string;
    status: string;
    massages: Array<{
        title: string;
        price: number;
        original_price: number | null;
    }> | null;
}

async function getBookingStats(supabase: SupabaseClient) {
    const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
            id,
            status,
            created_at,
            massages (title, price, original_price)
        `);

    if (error) {
        console.error('Error fetching bookings:', error);
        return {
            total: 0,
            new: 0,
            confirmed: 0,
            canceled: 0,
            recent: [],
            monthlyEarnings: 0,
        };
    }

    const total = bookings.length;
    const newCount = bookings.filter(b => b.status === 'new').length;
    const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
    const canceledCount = bookings.filter(b => b.status === 'canceled').length;
    const recent = bookings.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

    // Calculate monthly earnings
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyEarnings = bookings
        .filter(b => b.status === 'confirmed' || b.status === 'completed')
        .filter(b => {
            const bookingDate = new Date(b.created_at);
            return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
        })
        .reduce((sum, booking: any) => {
            if (booking.massages && booking.massages.price) {
                // Use the discounted price if original_price is set and greater than current price
                const effectivePrice = (booking.massages.original_price && booking.massages.original_price > booking.massages.price)
                    ? booking.massages.price
                    : booking.massages.original_price || booking.massages.price;
                return sum + effectivePrice;
            }
            return sum;
        }, 0);


    return {
        total,
        new: newCount,
        confirmed: confirmedCount,
        canceled: canceledCount,
        recent,
        monthlyEarnings,
    };
}


export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    const cookieStore = await cookies();
    const supabase = createSupabaseServerClient(cookieStore);
    
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect('/admin/login'); // Redirect if no session
    }
    
    const statsData = await getBookingStats(supabase);
    
    const stats = [
      { title: 'Всего заявок', value: statsData.total, icon: FileText },
      { title: 'Новые', value: statsData.new, icon: Activity },
      { title: 'Подтвержденные', value: statsData.confirmed, icon: CheckCircle },
      { title: 'Отмененные', value: statsData.canceled, icon: XCircle },
      { title: 'Заработок за месяц', value: `${statsData.monthlyEarnings} ₽`, icon: DollarSign }, // New stats card
    ];


  return (
    <>
      <div className="flex items-center justify-end mb-2">
        <OnlineUsersBadge />
      </div>
      <div className="grid gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const gradientColors = [
            'from-violet-500 to-indigo-500',
            'from-blue-500 to-cyan-500',
            'from-emerald-500 to-teal-500',
            'from-rose-500 to-pink-500',
            'from-amber-500 to-orange-500',
          ];
          const bgGradient = gradientColors[index % gradientColors.length];
          
          return (
            <Card key={stat.title} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border-0 overflow-hidden group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-neutral-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${bgGradient} shadow-sm group-hover:shadow-md transition-shadow`}>
                  <stat.icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-neutral-900">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <div className="grid gap-4 md:gap-6">
        <Card className="bg-white rounded-xl shadow-md border-0">
          <CardHeader className="border-b border-neutral-100 pb-4">
            <CardTitle className="text-xl font-semibold">Последние заявки</CardTitle>
            <CardDescription className="text-sm">
              5 последних созданных заявок
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <Table>
                <TableBody>
                    {statsData.recent.length > 0 ? statsData.recent.map((activity: any) => (
                        <TableRow key={activity.id} className="hover:bg-neutral-50/50 transition-colors">
                            <TableCell className="py-3">
                                <div className="font-medium text-neutral-900">Новая заявка на "{activity.massages && activity.massages[0]?.title ? activity.massages[0].title : 'массаж'}"</div>
                            </TableCell>
                            <TableCell className="text-right text-neutral-500 py-3">
                                {new Date(activity.created_at).toLocaleDateString('ru-RU', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric'
                                })}
                            </TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={2} className="text-center py-8 text-neutral-500">
                              Заявок пока нет.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
