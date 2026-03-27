const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://twnaxwvkxsjgogekawxq.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3bmF4d3ZreHNqZ29nZWthd3hxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjg3MTQxOSwiZXhwIjoyMDg4NDQ3NDE5fQ.2WSmotDf89O1GWStZzooPrO_bXDhj615vK1HpWwFejs'
);

async function cleanupCourses() {
    console.log("Looking for test or draft courses to delete...");

    // Find courses
    const { data: courses, error: fetchError } = await supabase
        .from('courses')
        .select('*')
        .or('status.eq.Draft,title.ilike.%test%,title.ilike.%demo%');

    if (fetchError) {
        console.error("Error fetching courses:", fetchError);
        return;
    }

    if (!courses || courses.length === 0) {
        console.log("No test or draft courses found.");
        return;
    }

    console.log(`Found ${courses.length} courses to delete:`);
    courses.forEach(c => console.log(` - [${c.status}] ${c.title} (ID: ${c.id})`));

    // Delete them
    const courseIds = courses.map(c => c.id);
    const { error: deleteError } = await supabase
        .from('courses')
        .delete()
        .in('id', courseIds);

    if (deleteError) {
        console.error("Error deleting courses:", deleteError);
    } else {
        console.log(`Successfully deleted ${courses.length} test/draft courses.`);
    }
}

cleanupCourses();
