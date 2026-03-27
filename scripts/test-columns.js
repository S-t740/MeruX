const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
    const columns = ['id', 'title', 'description', 'status', 'mentor_id', 'owner_id'];
    for (const col of columns) {
        const { error } = await supabase.from('projects').select(col).limit(1);
        if (error && error.code === 'PGRST204') {
            console.log(`Column MISSING: ${col}`);
        } else {
            console.log(`Column EXISTS: ${col}`);
        }
    }
}
checkSchema();
