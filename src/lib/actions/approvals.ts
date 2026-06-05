"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getPendingApprovals() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Unauthorized' }

    // Verify admin
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
        return { data: null, error: 'Forbidden' }
    }

    // Fetch pending profiles
    const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role, created_at')
        .eq('is_approved', false)
        .order('created_at', { ascending: false })

    return { data, error: error?.message }
}

import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export async function approveUser(userId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
        return { success: false, error: 'Forbidden' }
    }

    // Use Service Role key to bypass RLS for updating other users' profiles
    const adminSupabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await adminSupabase
        .from('profiles')
        .update({ is_approved: true })
        .eq('id', userId)

    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/admin/approvals')
    return { success: true }
}

export async function rejectUser(userId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
        return { success: false, error: 'Forbidden' }
    }

    // Use Service Role key to bypass RLS
    const adminSupabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await adminSupabase
        .from('profiles')
        .delete()
        .eq('id', userId)

    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/admin/approvals')
    return { success: true }
}
