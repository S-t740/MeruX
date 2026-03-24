"use server";

import { createClient } from "@supabase/supabase-js";

// Use service role for backend admin actions
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Records telemetry data for a specific learning session.
 */
export async function recordLessonAnalytics(
    userId: string,
    lessonId: string,
    timeSpentSeconds: number,
    videoDurationWatched: number,
    dropOffSecond: number,
    completed: boolean
) {
    if (!userId || !lessonId) return { error: "Missing required fields" };

    try {
        const { error } = await supabase.from('lesson_analytics').insert({
            user_id: userId,
            lesson_id: lessonId,
            time_spent_seconds: timeSpentSeconds,
            video_duration_watched: videoDurationWatched,
            drop_off_second: dropOffSecond,
            completed: completed
        });

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        console.error("Failed to record lesson telemetry:", error);
        return { error: error.message };
    }
}

/**
 * Aggregates Heatmap data for an instructor's courses.
 */
export async function getInstructorHeatmap(instructorId: string) {
    if (!instructorId) return [];

    try {
        // Find all lessons belonging to this instructor's courses
        const { data: courses, error: courseError } = await supabase
            .from('courses')
            .select('id, modules(lessons(id, title))')
            .eq('instructor_id', instructorId);

        if (courseError) throw courseError;
        if (!courses || courses.length === 0) return [];

        const lessonIds: string[] = [];
        const lessonMap: Record<string, string> = {}; // id -> title

        courses.forEach(c => {
            c.modules?.forEach((m: any) => {
                m.lessons?.forEach((l: any) => {
                    lessonIds.push(l.id);
                    lessonMap[l.id] = l.title;
                });
            });
        });

        if (lessonIds.length === 0) return [];

        // Fetch all analytics for these lessons
        const { data: analytics, error: analyticsError } = await supabase
            .from('lesson_analytics')
            .select('*')
            .in('lesson_id', lessonIds);

        if (analyticsError) throw analyticsError;
        if (!analytics || analytics.length === 0) return [];

        // Aggregate per lesson
        const aggregation: Record<string, { totalTime: number, count: number, completedCount: number }> = {};
        
        analytics.forEach(a => {
            if (!aggregation[a.lesson_id]) {
                aggregation[a.lesson_id] = { totalTime: 0, count: 0, completedCount: 0 };
            }
            aggregation[a.lesson_id].totalTime += a.time_spent_seconds;
            aggregation[a.lesson_id].count += 1;
            if (a.completed) aggregation[a.lesson_id].completedCount += 1;
        });

        // Format for Recharts
        const heatmapData = Object.keys(aggregation).map(lessonId => {
            const agg = aggregation[lessonId];
            return {
                lessonName: lessonMap[lessonId] || 'Unknown Lesson',
                avgTimeSpent: Math.round(agg.totalTime / agg.count),
                completionRate: Math.round((agg.completedCount / agg.count) * 100)
            };
        });

        return heatmapData;
    } catch (error: any) {
        console.error("Failed to fetch heatmap:", error);
        return [];
    }
}
