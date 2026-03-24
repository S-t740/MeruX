"use server";

import { createClient } from "@supabase/supabase-js";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

// Use service role for backend admin actions
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Uses Gemini to generate highly tailored project ideas based on the student's
 * complete skill profile and completed courses.
 */
export async function generateProjectIdeas(userId: string) {
    if (!userId) return { error: "User ID required" };

    try {
        // 1. Fetch user's completed courses
        const { data: enrollments } = await supabase
            .from('course_enrollments')
            .select('courses(title, category)')
            .eq('user_id', userId)
            .eq('status', 'completed');
            
        // 2. Fetch user's skill DNA
        const { data: userSkills } = await supabase
            .from('user_skills')
            .select('level_score, skills(name, category)')
            .eq('user_id', userId);

        const courseList = enrollments?.map((e: any) => e.courses?.title).join(', ') || 'No courses completed yet.';
        const skillList = userSkills?.map((s: any) => {
            const skillName = Array.isArray(s.skills) ? s.skills[0]?.name : s.skills?.name;
            return `${skillName} (Level Context: ${s.level_score})`;
        }).join(', ') || 'Basic foundations.';

        // 3. Prompt Gemini
        const systemPrompt = `
You are an elite Startup Incubator and Project Manager at MeruX.
Your goal is to brainstorm 3 UNIQUE, impressive, and resume-building project ideas 
for a student based exactly on their current capabilities.

Student Profile:
- Completed Courses: ${courseList}
- Skill DNA: ${skillList}

Guidelines:
1. Suggest exactly 3 projects.
2. The projects should combine multiple skills they possess.
3. Return the response strictly as a JSON array of objects.
4. Each object must have: 
   "title" (string, max 50 chars), 
   "problem_statement" (string, 1-2 sentences describing the problem being solved),
   "description" (string, 1-2 sentence pitch of the solution), 
   "difficulty" (string, enum: "Beginner", "Intermediate", "Advanced"), 
   "estimated_hours" (number).
Do not wrap your output in markdown formatting, just return valid JSON.
`;

        const googleCustom = createGoogleGenerativeAI({
            apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
        });

        const { text } = await generateText({
            model: googleCustom('gemini-2.5-flash'),
            prompt: systemPrompt
        });

        const rawJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const projects = JSON.parse(rawJson);

        // 4. Save to database
        const insertPayload = projects.map((p: any) => ({
            user_id: userId,
            title: p.title,
            problem_statement: p.problem_statement || p.description,
            description: p.description,
            difficulty: p.difficulty,
            estimated_hours: p.estimated_hours,
            status: 'suggested'
        }));

        const { data, error } = await supabase.from('project_ideas').insert(insertPayload).select();
        
        if (error) throw error;
        
        return { success: true, ideas: data };

    } catch (error: any) {
        console.error("Failed to generate project ideas:", error);
        return { error: error.message };
    }
}
