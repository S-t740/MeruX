import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://twnaxwvkxsjgogekawxq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3bmF4d3ZreHNqZ29nZWthd3hxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjg3MTQxOSwiZXhwIjoyMDg4NDQ3NDE5fQ.2WSmotDf89O1GWStZzooPrO_bXDhj615vK1HpWwFejs'
);

async function testSkills() {
  const { data: users, error: userErr } = await supabase.from('profiles').select('id').limit(3);
  if (userErr) {
    console.error("Error fetching users:", userErr);
    return;
  }
  
  if (users && users.length > 0) {
    for (const user of users) {
      console.log("Testing skills for user:", user.id);
      const { data: skills, error } = await supabase
        .from('user_skills')
        .select('level_score, skills(name, category)')
        .eq('user_id', user.id);
        
      if (error) {
        console.error("Error fetching skills:", error);
      } else {
        console.log("Skills fetched successfully:", JSON.stringify(skills, null, 2));
      }
    }
  } else {
    console.log("No users found");
  }
}
testSkills();
