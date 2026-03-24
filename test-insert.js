const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const supabase = createClient(
    'https://twnaxwvkxsjgogekawxq.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3bmF4d3ZreHNqZ29nZWthd3hxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjg3MTQxOSwiZXhwIjoyMDg4NDQ3NDE5fQ.2WSmotDf89O1GWStZzooPrO_bXDhj615vK1HpWwFejs'
);
async function test() {
    const { data: profile } = await supabase.from('profiles').select('id').eq('role', 'instructor').limit(1).single();

    const { data, error } = await supabase.from("courses").insert({
        title: "Test Course Title",
        description: "Test description",
        instructor_id: profile.id,
        status: 'published'
    });

    if (error) {
        fs.writeFileSync("error-log.json", JSON.stringify(error, null, 2));
        console.log("Error written to error-log.json");
    } else {
        console.log("Insert success!");
    }
}
test();
