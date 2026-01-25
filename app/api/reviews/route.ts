import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// GET all reviews
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
      console.error('Supabase session error in GET /api/reviews:', sessionError);
      return NextResponse.json({ error: sessionError.message }, { status: 500 });
    }
    console.log('GET /api/reviews: Session:', session ? 'Authenticated' : 'Unauthenticated');

    const { data, error } = await supabase
      .from('reviews')
      .select('*, massage:massages(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error fetching reviews:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.log('GET /api/reviews: Fetched data:', data);

    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    console.error('Unhandled error in GET /api/reviews:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST a new review
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

    const { massage_id, author_name, text, rating } = await request.json();

    if (!massage_id || !text || rating === undefined || rating === null) {
      return NextResponse.json(
        { error: 'massage_id, text, and rating are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert([
        {
          massage_id,
          author_name: author_name || null,
          text,
          rating,
        },
      ])
      .select();

    if (error) {
      console.error('Supabase error inserting review:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.log('POST /api/reviews: Inserted data:', data);

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error('Unhandled error in POST /api/reviews:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}