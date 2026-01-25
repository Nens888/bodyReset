import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// GET all bookings
export async function GET(request: NextRequest) {
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
      console.error('Supabase session error in GET /api/bookings:', sessionError);
      return NextResponse.json({ error: sessionError.message }, { status: 500 });
    }
    console.log('GET /api/bookings: Session:', session ? 'Authenticated' : 'Unauthenticated');

    // Only authenticated users can see all bookings
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('bookings')
      .select('*, massages (title, price, original_price)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error fetching bookings:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.log('GET /api/bookings: Fetched data:', data);

    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    console.error('Unhandled error in GET /api/bookings:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST a new booking
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
      console.error('Supabase session error in POST /api/bookings:', sessionError);
      return NextResponse.json({ error: sessionError.message }, { status: 500 });
    }
    console.log('POST /api/bookings: Session:', session ? 'Authenticated' : 'Unauthenticated');

    const { massage_id, date, time, contact } = await request.json();

    if (!massage_id || !date || !time || !contact) {
      return NextResponse.json(
        { error: 'Massage ID, date, time, and contact are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('bookings')
      .insert([{ 
        massage_id, 
        date, 
        time, 
        contact,
        status: 'new' // Default status for new bookings
      }])
      .select();

    if (error) {
      console.error('Supabase error inserting booking:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.log('POST /api/bookings: Inserted data:', data);

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error('Unhandled error in POST /api/bookings:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}