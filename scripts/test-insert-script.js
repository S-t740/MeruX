const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkInsert() {
    // Grab the first user profile id to use as owner_id
    const { data: users } = await supabase.from('profiles').select('id').limit(1);
    if (!users || users.length === 0) {
        console.log("No users found");
        return;
    }
    const userId = users[0].id;

    console.log("Testing insert with user id:", userId);
    const { data, error } = await supabase.from('projects').insert({
        title: "Test Launch",
        description: "Test Desc",
        status: "proposal",
        owner_id: userId
    }).select();

    console.log("Insert payload response:");
    console.log(JSON.stringify({ data, error }, null, 2));
}
checkInsert();
