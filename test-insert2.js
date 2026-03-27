const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkInsert() {
    const { data: users } = await supabase.from('profiles').select('id').limit(1);
    const userId = users[0].id;

    console.log("Testing insert without status...");
    const { error } = await supabase.from('projects').insert({
        title: "Test Launch",
        description: "Test Desc",
        owner_id: userId
    }).select();

    console.log(JSON.stringify(error, null, 2));
}
checkInsert();
