import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createClient } from '@/lib/supabase/server'
import { hasSupabaseEnv } from '@/lib/supabase/env'

export async function middleware(request: NextRequest) {
    if (!hasSupabaseEnv()) {
        return NextResponse.next({
            request: {
                headers: request.headers,
            },
        })
    }

    // Update session
    const response = await updateSession(request)
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    const { pathname } = request.nextUrl

    // Protected routes (everything except auth and home)
    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register')
    const isPublicPage = pathname === '/' || pathname.startsWith('/api/') || pathname.startsWith('/_next')

    if (!user && !isAuthPage && !isPublicPage) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    if (user && isAuthPage) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Role-based access control
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, is_approved')
            .eq('id', user.id)
            .single()

        const role = profile?.role
        // Only explicitly set false triggers pending. Null/undefined (legacy) or true means approved.
        const isPending = profile?.is_approved === false;

        // Pending Approval Trap
        if (isPending && pathname !== '/pending-approval') {
            return NextResponse.redirect(new URL('/pending-approval', request.url))
        }

        // Redirect away from pending if already approved
        if (!isPending && pathname === '/pending-approval') {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }

        // Simple RBAC rules
        if (pathname.startsWith('/admin') && role !== 'admin' && role !== 'super_admin') {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
        if (pathname.startsWith('/dashboard/super_admin') && role !== 'super_admin') {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
