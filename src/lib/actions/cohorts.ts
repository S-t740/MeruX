"use server";

import { createClient } from "@supabase/supabase-js";

// Use service role to bypass RLS for administrative actions built into server functions
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Creates a new cohort linked to a specific course
 */
export async function createCohort(
    courseId: string, 
    name: string, 
    description: string, 
    startDate?: string, 
    endDate?: string
) {
    if (!courseId || !name) return { error: "Course ID and Name are required" };

    try {
        const { data, error } = await supabase
            .from('cohorts')
            .insert({
                course_id: courseId,
                name,
                description,
                start_date: startDate || null,
                end_date: endDate || null
            })
            .select()
            .single();

        if (error) throw error;
        return { success: true, cohort: data };
    } catch (error: any) {
        console.error("Failed to create cohort:", error);
        return { error: error.message };
    }
}

/**
 * Adds a student to a cohort AND auto-enrolls them in the associated course
 */
export async function addStudentToCohort(cohortId: string, userId: string) {
    if (!cohortId || !userId) return { error: "Cohort ID and User ID are required" };

    try {
        // 1. Get the course_id associated with this cohort
        const { data: cohort, error: cohortError } = await supabase
            .from('cohorts')
            .select('course_id')
            .eq('id', cohortId)
            .single();

        if (cohortError || !cohort) throw new Error("Cohort not found");

        // 2. Add to cohort_members
        const { error: memberError } = await supabase
            .from('cohort_members')
            .upsert({
                cohort_id: cohortId,
                user_id: userId,
                role: 'student'
            }, { onConflict: 'cohort_id,user_id' });

        if (memberError) throw memberError;

        // 3. Auto-enroll in the course using course_enrollments
        const { error: enrollError } = await supabase
            .from('course_enrollments')
            .upsert({
                user_id: userId,
                course_id: cohort.course_id,
                status: 'active'
            }, { onConflict: 'user_id,course_id' });

        if (enrollError) throw enrollError;

        return { success: true, message: "Student added to cohort and enrolled in course" };
    } catch (error: any) {
        console.error("Failed to add student to cohort:", error);
        return { error: error.message };
    }
}

/**
 * Removes a student from a cohort
 */
export async function removeStudentFromCohort(cohortId: string, userId: string) {
    if (!cohortId || !userId) return { error: "Cohort ID and User ID are required" };

    try {
        const { error } = await supabase
            .from('cohort_members')
            .delete()
            .match({ cohort_id: cohortId, user_id: userId });

        if (error) throw error;

        // Note: We intentionally don't un-enroll them from the course automatically
        // as they might simply be moving to a different cohort or finishing independently.

        return { success: true, message: "Student removed from cohort" };
    } catch (error: any) {
        console.error("Failed to remove student from cohort:", error);
        return { error: error.message };
    }
}
