const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
    'https://twnaxwvkxsjgogekawxq.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3bmF4d3ZreHNqZ29nZWthd3hxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjg3MTQxOSwiZXhwIjoyMDg4NDQ3NDE5fQ.2WSmotDf89O1GWStZzooPrO_bXDhj615vK1HpWwFejs'
);
async function test() {
    const { data, error } = await supabase.rpc('get_course_status_enum', {}); // Might not exist.
    // We can't query system tables via Supabase client directly usually unless RLS allows or we use service role.
    // Actually, let's just make a REST call using service role, or better, we can query it using Postgres directly if we have conn string, but we don't.
    // Let's run a generic RPC if one exists, or let's try inserting another value to see if it works. Common ones: 'Active', 'Draft', 'Published', 'Archived' (Note casing: 'published' vs 'Published').
    const statusesToTest = ['Draft', 'draft', 'Published', 'Active', 'active'];

    for (const s of statusesToTest) {
        const { data: profile } = await supabase.from('profiles').select('id').eq('role', 'instructor').limit(1).single();
        const { error } = await supabase.from("courses").insert({
            title: "Test " + s,
            instructor_id: profile.id,
            status: s
        });
        if (error && error.code === '22P02') {
            console.log(`Failed enum for ${s}`);
        } else if (error) {
            console.log(`Error for ${s}:`, error.message);
        } else {
            console.log(`SUCCESS for ${s}`);
        }
    }
}
test();
