"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─────────────────────────────────────────────
// STUDENT: Submit a skills assessment
// ─────────────────────────────────────────────
export async function submitSkillsAssessment(
    assessmentId: string,
    studentId: string,
    data: {
        submission_url?: string;
        submission_text?: string;
        notes?: string;
    }
) {
    if (!data.submission_url && !data.submission_text)
        return { error: "You must provide a submission URL or text." };

    // Upsert (student may resubmit before grading)
    const { data: submission, error } = await adminSupabase
        .from("skills_submissions")
        .upsert(
            {
                assessment_id: assessmentId,
                student_id: studentId,
                submission_url: data.submission_url || null,
                submission_text: data.submission_text || null,
                notes: data.notes || null,
                status: "submitted",
                submitted_at: new Date().toISOString(),
                score: null,
                feedback: null,
            },
            { onConflict: "assessment_id,student_id" }
        )
        .select()
        .single();

    if (error) return { error: error.message };
    revalidatePath(`/courses/${submission.assessment_id}`);
    return { data: submission };
}

// ─────────────────────────────────────────────
// INSTRUCTOR: Get all submissions for an assessment
// ─────────────────────────────────────────────
export async function getAssessmentSubmissions(assessmentId: string) {
    const { data, error } = await adminSupabase
        .from("skills_submissions")
        .select("*, profiles(full_name, avatar_url, email)")
        .eq("assessment_id", assessmentId)
        .order("submitted_at", { ascending: false });

    if (error) return { error: error.message };
    return { data };
}

// ─────────────────────────────────────────────
// INSTRUCTOR: Get all pending submissions for a course
// ─────────────────────────────────────────────
export async function getPendingSubmissions(courseId: string) {
    const { data, error } = await adminSupabase
        .from("skills_submissions")
        .select("*, profiles(full_name, avatar_url), skills_assessments!inner(course_id, title, max_score, passing_score)")
        .eq("skills_assessments.course_id", courseId)
        .in("status", ["submitted", "under_review"])
        .order("submitted_at");

    if (error) return { error: error.message };
    return { data };
}

// ─────────────────────────────────────────────
// INSTRUCTOR: Grade a submission
// ─────────────────────────────────────────────
export async function gradeSkillsSubmission(
    submissionId: string,
    instructorId: string,
    data: {
        score: number;
        feedback: string;
        rubric_scores?: { criterion: string; score: number; max: number }[];
    }
) {
    const { data: submission, error: fetchErr } = await adminSupabase
        .from("skills_submissions")
        .select("*, skills_assessments(course_id, max_score, passing_score)")
        .eq("id", submissionId)
        .single();

    if (fetchErr || !submission) return { error: "Submission not found." };

    const { error: gradeErr } = await adminSupabase
        .from("skills_submissions")
        .update({
            score: data.score,
            feedback: data.feedback,
            rubric_scores: data.rubric_scores || [],
            graded_by: instructorId,
            graded_at: new Date().toISOString(),
            status: "graded",
        })
        .eq("id", submissionId);

    if (gradeErr) return { error: gradeErr.message };

    // Update course_results with new skills_score
    const courseId = submission.skills_assessments.course_id;
    const maxScore = submission.skills_assessments.max_score || 100;
    const normalizedScore = Math.round((data.score / maxScore) * 100);

    await upsertCourseResult(submission.student_id, courseId, { skills_score: normalizedScore });

    revalidatePath(`/dashboard/instructor/assessments`);
    return { success: true };
}

// ─────────────────────────────────────────────
// Create / update an assessment (instructor)
// ─────────────────────────────────────────────
export async function createSkillsAssessment(
    courseId: string,
    instructorId: string,
    data: {
        title: string;
        description?: string;
        module_id?: string;
        rubric?: { criterion: string; max_points: number; description: string }[];
        max_score?: number;
        passing_score?: number;
        grading_type?: "manual" | "hybrid";
        due_date?: string;
    }
) {
    const { data: assessment, error } = await adminSupabase
        .from("skills_assessments")
        .insert({
            course_id: courseId,
            created_by: instructorId,
            title: data.title,
            description: data.description,
            module_id: data.module_id || null,
            rubric: data.rubric || [],
            max_score: data.max_score ?? 100,
            passing_score: data.passing_score ?? 60,
            grading_type: data.grading_type ?? "manual",
            due_date: data.due_date || null,
        })
        .select()
        .single();

    if (error) return { error: error.message };
    revalidatePath(`/dashboard/instructor/assessments`);
    return { data: assessment };
}

// ─────────────────────────────────────────────
// INTERNAL: Upsert course_results fields
// ─────────────────────────────────────────────
export async function upsertCourseResult(
    studentId: string,
    courseId: string,
    updates: Partial<{
        quiz_average: number;
        skills_score: number;
        final_exam_score: number;
    }>
) {
    // Fetch current row
    const { data: existing } = await adminSupabase
        .from("course_results")
        .select("*")
        .eq("student_id", studentId)
        .eq("course_id", courseId)
        .single();

    const merged = {
        student_id: studentId,
        course_id: courseId,
        quiz_average: existing?.quiz_average ?? 0,
        skills_score: existing?.skills_score ?? 0,
        final_exam_score: existing?.final_exam_score ?? 0,
        ...updates,
    };

    // Weighted overall: quiz_avg*0.3 + skills*0.2 + final*0.5
    const overall = +(
        (merged.quiz_average * 0.3) +
        (merged.skills_score * 0.2) +
        (merged.final_exam_score * 0.5)
    ).toFixed(2);

    const passed = merged.final_exam_score >= 60 && overall >= 70;
    const failed = merged.final_exam_score > 0 && !passed;
    const inProgress = merged.final_exam_score === 0;

    const grade = passed
        ? overall >= 90 ? "distinction" : overall >= 75 ? "credit" : "pass"
        : "fail";

    const status = passed ? "pass" : failed ? "fail" : "in_progress";

    const { error } = await adminSupabase
        .from("course_results")
        .upsert(
            {
                ...merged,
                overall_score: overall,
                status,
                grade: inProgress ? null : grade,
                updated_at: new Date().toISOString(),
            },
            { onConflict: "student_id,course_id" }
        );

    if (error) {
        console.error("Error upserting course_results:", error);
        return { error: error.message };
    }

    // Auto-issue certificate on pass
    if (passed) {
        await issueCertificate(studentId, courseId, overall, grade);
    }

    return { success: true, overall_score: overall, status, grade };
}

// ─────────────────────────────────────────────
// AUTO: Issue certificate
// ─────────────────────────────────────────────
async function issueCertificate(
    studentId: string,
    courseId: string,
    finalScore: number,
    grade: string
) {
    // Idempotent: only issue once
    const { data: existing } = await adminSupabase
        .from("certificates")
        .select("id")
        .eq("student_id", studentId)
        .eq("course_id", courseId)
        .single();

    if (existing) return; // already issued

    const certCode = `CERT-${courseId.substring(0, 8).toUpperCase()}-${studentId.substring(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    await adminSupabase.from("certificates").insert({
        student_id: studentId,
        course_id: courseId,
        final_score: finalScore,
        grade,
        certificate_code: certCode,
        is_valid: true,
    });
}

// ─────────────────────────────────────────────
// Get student course results summary
// ─────────────────────────────────────────────
export async function getCourseResults(studentId: string, courseId: string) {
    const { data: results } = await adminSupabase
        .from("course_results")
        .select("*")
        .eq("student_id", studentId)
        .eq("course_id", courseId)
        .single();

    const { data: certificate } = await adminSupabase
        .from("certificates")
        .select("*")
        .eq("student_id", studentId)
        .eq("course_id", courseId)
        .single();

    return { results, certificate };
}

// ─────────────────────────────────────────────
// Public: Verify certificate by code
// ─────────────────────────────────────────────
export async function verifyCertificate(certificateCode: string) {
    const { data, error } = await adminSupabase
        .from("certificates")
        .select("*, profiles!student_id(full_name, avatar_url), courses(title, instructor_id)")
        .eq("certificate_code", certificateCode)
        .single();

    if (error || !data) return { error: "Certificate not found or invalid." };
    return { data };
}
