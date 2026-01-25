import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// DELETE a quick reply
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Supabase session error in DELETE /api/chat/quick-replies/[id]:', sessionError);
      return NextResponse.json({ error: sessionError.message }, { status: 500 });
    }

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('quick_replies')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error('Supabase error deleting quick reply:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    console.error('Unhandled error in DELETE /api/chat/quick-replies/[id]:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}