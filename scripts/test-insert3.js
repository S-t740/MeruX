const { createClient } = require('@supabase/supabase-js');

const supabaseService = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const supabaseAnon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkInsert() {
    const { data: users } = await supabaseService.from('profiles').select('id').limit(1);
    const userId = users[0].id;

    console.log("Testing insert with service role (bypass RLS)...");
    const { data: serviceData, error: serviceError } = await supabaseService.from('projects').insert({
        title: "Test Project",
        description: "Test Desc",
        status: "proposal",
        owner_id: userId
    }).select();

    console.log("Service Role Response:", JSON.stringify({ data: serviceData, error: serviceError }, null, 2));

    // We can't fully mock an authenticated insert without a user JWT, but we can verify if Service Role works.
    // If Service Role fails, it's a schema issue. If it succeeds, it's an RLS issue.
}
checkInsert();
