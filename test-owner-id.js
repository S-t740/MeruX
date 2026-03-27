const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
    // Attempt to select owner_id from projects to see if it exists
    const { data, error } = await supabase.from('projects').select('id, owner_id').limit(1);
    
    if (error) {
        console.error("Schema Check Error:", error);
    } else {
        console.log("Schema Check Success. owner_id exists!");
        // Let's also check RLS policies by trying to insert with anon key
    }
}
checkSchema();
