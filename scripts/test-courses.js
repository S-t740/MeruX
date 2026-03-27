const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://twnaxwvkxsjgogekawxq.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3bmF4d3ZreHNqZ29nZWthd3hxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjg3MTQxOSwiZXhwIjoyMDg4NDQ3NDE5fQ.2WSmotDf89O1GWStZzooPrO_bXDhj615vK1HpWwFejs'
);

async function test() {
    // try to fetch a course
    const { data: courses } = await supabase.from('courses').select('*').limit(1);
    console.log('Course:', courses?.[0]);

    if (!courses || courses.length === 0) return;

    // test updating the course
    const { data, error } = await supabase.from('courses').update({
        title: courses[0].title,
        description: courses[0].description,
        thumbnail_url: courses[0].thumbnail_url || 'test'
    }).eq('id', courses[0].id).select();

    if (error) {
        console.error("Supabase Error Full Object:", error);
    } else {
        console.log("Success! Update worked via service role.");
    }
}

test();
