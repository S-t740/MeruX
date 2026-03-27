const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export function hasSupabaseEnv() {
    return Boolean(supabaseUrl && supabaseAnonKey)
}

export function getSupabaseEnv() {
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error(
            'Missing Supabase environment variables: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
        )
    }

    return {
        supabaseUrl,
        supabaseAnonKey,
    }
}
