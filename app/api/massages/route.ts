import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// GET all massages
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
      console.error('Supabase session error in GET /api/massages:', sessionError);
      return NextResponse.json({ error: sessionError.message }, { status: 500 });
    }
    console.log('GET /api/massages: Session:', session ? 'Authenticated' : 'Unauthenticated');

    const { data, error } = await supabase.from('massages').select('*');

    if (error) {
      console.error('Supabase error fetching massages:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.log('GET /api/massages: Fetched data:', data);

    return NextResponse.json(data, { status: 200 }); // No response.headers needed here
  } catch (err: any) {
    console.error('Unhandled error in GET /api/massages:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST a new massage
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
      console.error('Supabase session error in POST /api/massages:', sessionError);
      return NextResponse.json({ error: sessionError.message }, { status: 500 });
    }
    console.log('POST /api/massages: Session:', session ? 'Authenticated' : 'Unauthenticated');

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, duration, price, original_price, zones } = await request.json();

    if (!title || !duration || !price) {
      return NextResponse.json(
        { error: 'Title, duration, and price are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('massages')
      .insert([{ title, description, duration, price, original_price, zones: zones || [] }])
      .select();

    if (error) {
      console.error('Supabase error inserting massage:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.log('POST /api/massages: Inserted data:', data);

    return NextResponse.json(data, { status: 201 }); // No response.headers needed here
  } catch (err: any) {
    console.error('Unhandled error in POST /api/massages:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}