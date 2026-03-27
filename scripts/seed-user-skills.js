import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://twnaxwvkxsjgogekawxq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3bmF4d3ZreHNqZ29nZWthd3hxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjg3MTQxOSwiZXhwIjoyMDg4NDQ3NDE5fQ.2WSmotDf89O1GWStZzooPrO_bXDhj615vK1HpWwFejs'
);

async function seedUserSkills() {
    console.log("Seeding fake Skill DNA for users...");
    const { data: users, error: userError } = await supabase.from('profiles').select('id');
    const { data: skills, error: skillError } = await supabase.from('skills').select('id, name');
    
    if (userError || skillError || !users || !skills) {
        console.error("Missing users or skills", userError, skillError);
        return;
    }

    if (users.length === 0) {
        console.error("No users found to seed.");
        return;
    }

    for (const user of users) {
        let inserted = 0;
        for (const skill of skills) {
             const randomScore = Math.floor(Math.random() * 60) + 40; // 40 to 100
             const { error } = await supabase.from('user_skills').upsert({
                 user_id: user.id,
                 skill_id: skill.id,
                 level_score: randomScore,
                 confidence_score: 100,
                 last_assessed_at: new Date().toISOString()
             }, { onConflict: 'user_id,skill_id' });
             if (!error) inserted++;
        }
        console.log(`✅ Seeded ${inserted} skills for user ${user.id}`);
    }
    console.log("Done seeding user skills!");
}
seedUserSkills();
