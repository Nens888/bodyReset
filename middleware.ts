import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    // IMPORTANT: In Edge middleware on Vercel, request.cookies is read-only.
    // You must only set cookies on the NextResponse.
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    const url = request.nextUrl
    const isAdminRoute = url.pathname.startsWith('/admin')
    const isLoginRoute = url.pathname === '/admin/login' || url.pathname === '/admin/login/'

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return response
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Re-create the response so Next can properly forward headers/cookies
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })

          for (const cookie of cookiesToSet) {
            response.cookies.set(cookie)
          }
        },
      },
    })

    // Wrap auth calls to avoid throwing (would surface as MIDDLEWARE_INVOCATION_FAILED)
    let hasSession = false
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      hasSession = !!session
    } catch (err) {
      console.error('[middleware] supabase.auth.getSession failed', {
        path: url.pathname,
        err,
      })
      return response
    }

    const redirectTo = (pathname: string) => {
      const redirectUrl = new URL(pathname, request.url)
      const redirectResponse = NextResponse.redirect(redirectUrl)

      // Copy any cookies that were set during this middleware run
      for (const cookie of response.cookies.getAll()) {
        redirectResponse.cookies.set(cookie)
      }
      return redirectResponse
    }

    if (isAdminRoute && !hasSession && !isLoginRoute) {
      return redirectTo('/admin/login')
    }

    if (isLoginRoute && hasSession) {
      return redirectTo('/admin/dashboard')
    }

    return response
  } catch (err: any) {
    // Last resort: never throw from middleware on Vercel.
    console.error('[middleware] unhandled error', {
      url: request.nextUrl?.href,
      message: err?.message,
      stack: err?.stack,
    })
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api
     */
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
}