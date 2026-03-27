const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://twnaxwvkxsjgogekawxq.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3bmF4d3ZreHNqZ29nZWthd3hxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjg3MTQxOSwiZXhwIjoyMDg4NDQ3NDE5fQ.2WSmotDf89O1GWStZzooPrO_bXDhj615vK1HpWwFejs'
);

async function seedSkills() {
    console.log("Seeding base Skill DNA categories...");

    const baseSkills = [
        { name: 'Frontend Development', category: 'technical', description: 'Building user interfaces with modern web technologies.' },
        { name: 'Backend Systems', category: 'technical', description: 'Designing server logic, APIs, and databases.' },
        { name: 'UI/UX Design', category: 'creative', description: 'Crafting intuitive and aesthetically pleasing digital experiences.' },
        { name: 'Data Analytics', category: 'technical', description: 'Processing and visualizing complex data sets.' },
        { name: 'Project Management', category: 'leadership', description: 'Organizing and leading development teams to success.' },
        { name: 'Artificial Intelligence', category: 'technical', description: 'Implementing ML models and generative AI systems.' },
        { name: 'Communication', category: 'soft_skill', description: 'Effectively articulating ideas verbally and in writing.' },
        { name: 'Problem Solving', category: 'soft_skill', description: 'Overcoming complex technical blocks.' }
    ];

    for (const skill of baseSkills) {
        const { error } = await supabase.from('skills').upsert(skill, { onConflict: 'name' });
        if (error) {
            console.error(`Failed to insert ${skill.name}:`, error);
        } else {
            console.log(`✅ Seeded skill: ${skill.name}`);
        }
    }
    console.log("Seeding complete!");
}

seedSkills();
