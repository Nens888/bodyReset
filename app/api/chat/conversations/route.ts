import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// GET list of conversations (admin only)
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
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Supabase session error in GET /api/chat/conversations:', sessionError);
      return NextResponse.json({ error: sessionError.message }, { status: 500 });
    }

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Prefer view created in SQL migration
    const { data: viewData, error: viewError } = await supabase
      .from('chat_conversations')
      .select('*')
      .order('last_message_at', { ascending: false });

    if (!viewError) {
      return NextResponse.json(viewData || [], { status: 200 });
    }

    // Fallback: list distinct chat_id (no unread counts / last_message)
    const { data: distinctData, error: distinctError } = await supabase
      .from('messages')
      .select('chat_id')
      .not('chat_id', 'is', null);

    if (distinctError) {
      console.error('Supabase error fetching conversations:', distinctError);
      return NextResponse.json({ error: distinctError.message }, { status: 500 });
    }

    const unique = Array.from(new Set((distinctData || []).map((r: any) => r.chat_id))).filter(Boolean);

    return NextResponse.json(
      unique.map((chat_id) => ({ chat_id, last_message_at: null, unread_count: 0 })),
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Unhandled error in GET /api/chat/conversations:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
