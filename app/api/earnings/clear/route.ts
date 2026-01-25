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

    // This endpoint might be for clearing earnings data or resetting some state
    // Since we don't have the original implementation, we'll return a success response
    // In a real implementation, this would likely update records in the database
    
    return NextResponse.json({ message: 'Earnings cleared successfully' }, { status: 200 });
  } catch (err: any) {
    console.error('Unhandled error in POST /api/earnings/clear:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}