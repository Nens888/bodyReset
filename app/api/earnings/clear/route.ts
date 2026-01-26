import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// POST to clear earnings (this is likely to reset/clear some data)
export async function POST(request: NextRequest) {
  try {
    let response = NextResponse.next({ request });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => request.cookies.get(name)?.value,
          set: (name: string, value: string, options: any) => {
            request.cookies.set({ name, value, ...options });
            response = NextResponse.next({ request });
            response.cookies.set({ name, value, ...options });
          },
          remove: (name: string, options: any) => {
            request.cookies.set({ name, value: '', ...options });
            response = NextResponse.next({ request });
            response.cookies.set({ name, value: '', ...options });
          },
        },
      }
    );

    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Supabase session error in POST /api/earnings/clear:', sessionError);
      return NextResponse.json({ error: sessionError.message }, { status: 500 });
    }

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Получаем год и месяц из тела запроса
    const body = await request.json();
    const { year, month } = body;

    if (!year || !month) {
      return NextResponse.json({ error: 'Year and month are required' }, { status: 400 });
    }

    // Форматируем месяц в формат YYYY-MM для поиска в created_at
    const monthString = `${year}-${month.toString().padStart(2, '0')}`;

    // Очищаем заработок за выбранный месяц - удаляем или обнуляем bookings за месяц
    // Вариант 1: удаляем bookings за месяц
    const startDate = `${monthString}-01T00:00:00.000Z`;
    const endDate = `${monthString}-31T23:59:59.999Z`;
    
    const { data, error } = await supabase
      .from('bookings')
      .delete()
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .select();

    if (error) {
      console.error('Supabase error clearing earnings:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Earnings cleared successfully',
      clearedBookings: data?.length || 0
    }, { status: 200 });
  } catch (err: any) {
    console.error('Unhandled error in POST /api/earnings/clear:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
