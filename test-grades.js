const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://twnaxwvkxsjgogekawxq.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3bmF4d3ZreHNqZ29nZWthd3hxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjg3MTQxOSwiZXhwIjoyMDg4NDQ3NDE5fQ.2WSmotDf89O1GWStZzooPrO_bXDhj615vK1HpWwFejs'
);

async function testGrades() {
    console.log("Testing inserting a grade...");

    // Find any submission
    const { data: submissions, error: fetchError } = await supabase
        .from('submissions')
        .select('*')
        .limit(1);

    if (fetchError || !submissions || submissions.length === 0) {
        console.error("No submissions found or error:", fetchError);
        return;
    }

    const sub = submissions[0];

    const { data, error } = await supabase
        .from('grades')
        .upsert({
            submission_id: sub.id,
            score: 100,
            feedback: "Test feedback",
            grader_id: sub.user_id // use anyone for test
        })
        .select();

    if (error) {
        console.error("Grade Insert Error:", JSON.stringify(error, null, 2));
    } else {
        console.log("Success inserting grade:", data);
    }
}

testGrades();
