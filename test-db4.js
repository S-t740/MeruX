const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
    'https://twnaxwvkxsjgogekawxq.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3bmF4d3ZreHNqZ29nZWthd3hxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjg3MTQxOSwiZXhwIjoyMDg4NDQ3NDE5fQ.2WSmotDf89O1GWStZzooPrO_bXDhj615vK1HpWwFejs'
);
async function test() {
    const { data, error } = await supabase.from('courses').select('status');
    if (error) {
        console.log("Error:", error);
    } else {
        const distinctStatuses = [...new Set(data.map(d => d.status))];
        console.log("Existing statuses:", distinctStatuses);
    }
}
test();
