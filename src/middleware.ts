import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createClient } from '@/lib/supabase/server'

export async function middleware(request: NextRequest) {
    // Update session
    const response = await updateSession(request)
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    const { pathname } = request.nextUrl

    // Protected routes (everything except auth and home)
    const isAuthPage = pathname.startsWith('/login')
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
            .select('role')
            .eq('id', user.id)
            .single()

        const role = profile?.role

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
