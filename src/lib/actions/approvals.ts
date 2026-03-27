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
        .select('id, first_name, last_name, email, role, created_at')
        .eq('is_approved', false)
        .order('created_at', { ascending: false })

    return { data, error: error?.message }
}

export async function approveUser(userId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
        return { success: false, error: 'Forbidden' }
    }

    const { error } = await supabase
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

    // In a real system you might delete the auth.users account using the admin API 
    // or set a 'rejected' status. Here we'll just delete the profile which acts as a hard block.
    // However, since we don't have rpc to delete auth.user purely from frontend server action easily,
    // we can just delete from public.profiles, removing their dashboard access altogether.
    const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/admin/approvals')
    return { success: true }
}
