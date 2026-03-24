"use server";

import { createClient } from "@supabase/supabase-js";

// Use service role for backend admin actions
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Awards skill points to a user and updates their Skill DNA profile.
 * 
 * @param userId UUID of the user
 * @param skillId UUID of the skill
 * @param points Number of points to award
 * @param eventType String describing the event ('course_completion', 'assignment_score', 'peer_collaboration')
 * @param referenceId Optional UUID linking to the source (e.g., Course ID)
 */
export async function awardSkillPoints(
    userId: string,
    skillId: string,
    points: number,
    eventType: string,
    referenceId?: string
) {
    if (!userId || !skillId) return { error: "Missing required fields" };

    try {
        // 1. Log the event
        const { error: eventError } = await supabase.from('skill_events').insert({
            user_id: userId,
            skill_id: skillId,
            event_type: eventType,
            points_awarded: points,
            reference_id: referenceId || null
        });

        if (eventError) throw eventError;

        // 2. Compute the new totals. 
        // We'll calculate total points and number of events for confidence score.
        const { data: events, error: fetchEventsError } = await supabase
            .from('skill_events')
            .select('points_awarded')
            .eq('user_id', userId)
            .eq('skill_id', skillId);

        if (fetchEventsError) throw fetchEventsError;

        const totalPoints = events?.reduce((sum, e) => sum + e.points_awarded, 0) || 0;
        const totalEvents = events?.length || 0;

        // Bounded Level Score (Max 100 in this simple MVP logic, or infinite. Let's say 100 is master)
        // 1000 points = Level 100
        let levelScore = Math.floor(totalPoints / 10);
        if (levelScore > 100) levelScore = 100;

        // Confidence Score (Max 100). Reaches 100% after 10 robust events.
        let confidenceScore = Math.min(totalEvents * 10, 100);

        // 3. Upsert into user_skills
        const { error: upsertError } = await supabase.from('user_skills').upsert({
            user_id: userId,
            skill_id: skillId,
            level_score: levelScore,
            confidence_score: confidenceScore,
            last_assessed_at: new Date().toISOString()
        }, {
            onConflict: 'user_id,skill_id'
        });

        if (upsertError) throw upsertError;

        return { success: true, levelScore, confidenceScore };
    } catch (error: any) {
        console.error("Failed to award skill points:", error);
        return { error: error.message };
    }
}

/**
 * Automatically maps a course to a skill and awards DNA points.
 */
export async function awardCourseCompletionDna(userId: string, courseId: string) {
    try {
        // Fetch course title
        const { data: course } = await supabase.from('courses').select('title, category').eq('id', courseId).single();
        if (!course) return { error: "Course not found" };

        let keyword = 'Frontend Development'; // default
        const text = (course.title + " " + (course.category || '')).toLowerCase();
        
        if (text.includes('react') || text.includes('next') || text.includes('ui') || text.includes('frontend')) keyword = 'Frontend Development';
        if (text.includes('node') || text.includes('database') || text.includes('backend') || text.includes('sql')) keyword = 'Backend Systems';
        if (text.includes('design') || text.includes('figma')) keyword = 'UI/UX Design';
        if (text.includes('data') || text.includes('python')) keyword = 'Data Analytics';
        if (text.includes('manage') || text.includes('agile')) keyword = 'Project Management';
        if (text.includes('ai') || text.includes('machine learning')) keyword = 'Artificial Intelligence';

        // Find the skill ID
        const { data: skill } = await supabase.from('skills').select('id').eq('name', keyword).single();
        if (!skill) return { error: "Skill not mapped" };

        // Award 150 points for completing a course
        return await awardSkillPoints(userId, skill.id, 150, 'course_completion', courseId);
    } catch (error: any) {
        console.error("Error in awardCourseCompletionDna:", error);
        return { error: error.message };
    }
}
