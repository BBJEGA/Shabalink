
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // 1. Create Supabase Client
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // 2. Check Auth Session
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // 3. Define Protected Routes
    const isDashboard = request.nextUrl.pathname.startsWith('/dashboard');
    const isProfile = request.nextUrl.pathname.startsWith('/profile');
    const isOnboarding = request.nextUrl.pathname.startsWith('/onboarding');
    const isAuthPage = ['/login', '/signup', '/forgot-password'].includes(request.nextUrl.pathname);

    // REDIRECT: Unauth User trying to access protected routes
    if (!user && (isDashboard || isProfile || isOnboarding)) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // REDIRECT: Auth User trying to access Login/Signup
    if (user && isAuthPage) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // 4. Check Onboarding Status (PIN)
    if (user && !isOnboarding && !request.nextUrl.pathname.startsWith('/api') && !request.nextUrl.pathname.startsWith('/_next')) {
        // We need to check if they have a PIN. 
        // NOTE: Middleware reading DB is generally okay with Supabase, but strictly limited.
        // Ideally we check a cookie or metadata.
        // For now, let's query the profile.
        const { data: profile } = await supabase
            .from('profiles')
            .select('transaction_pin')
            .eq('id', user.id)
            .single();

        if (profile && !profile.transaction_pin) {
            // Redirect to PIN creation if they don't have one
            return NextResponse.redirect(new URL('/onboarding/pin', request.url));
        }
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
