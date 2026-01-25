import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// GET all chat messages
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

    const chatId = request.nextUrl.searchParams.get('chat_id');

    // If no chat_id is provided, this is an admin request: require auth
    if (!chatId) {
      const {
        data: { session },
        error: sessionError
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('Supabase session error in GET /api/chat/messages:', sessionError);
        return NextResponse.json({ error: sessionError.message }, { status: 500 });
      }
      console.log('GET /api/chat/messages: Session:', session ? 'Authenticated' : 'Unauthenticated');

      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    let query = supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true });

    if (chatId) {
      query = query.eq('chat_id', chatId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error fetching messages:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log('GET /api/chat/messages: Fetched data:', data);

    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    console.error('Unhandled error in GET /api/chat/messages:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST a new message
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

    const { message, sender_type, sender_id, chat_id } = await request.json();

    if (!message || !sender_type || !sender_id || !chat_id) {
      return NextResponse.json(
        { error: 'Message, sender_type, sender_id, and chat_id are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('messages')
      .insert([{ 
        message, 
        sender_type, 
        sender_id,
        chat_id,
        is_read: false
      }])
      .select();

    if (error) {
      console.error('Supabase error inserting message:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.log('POST /api/chat/messages: Inserted data:', data);

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error('Unhandled error in POST /api/chat/messages:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}