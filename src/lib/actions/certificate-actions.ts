"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";

export async function generateCertificate(courseId: string) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();

  if (!user.user) throw new Error("Unauthorized");

  // Check if completed course
  const { data: progress, error: progressError } = await supabase
    .from("course_progress")
    .select("final_exam_completed, overall_score")
    .eq("course_id", courseId)
    .eq("student_id", user.user.id)
    .single();

  // Uncomment/modify if you want strict checking
  // if (!progress || !progress.final_exam_completed) {
  //   throw new Error("Course not fully completed. Cannot generate certificate.");
  // }

  const finalScore = progress?.overall_score || 0;

  // Check if certificate already exists
  const { data: existingCert } = await supabase
    .from("course_certificates")
    .select("*")
    .eq("course_id", courseId)
    .eq("student_id", user.user.id)
    .single();

  if (existingCert) {
    return existingCert;
  }

  // Generate unique certificate ID
  const certificateCode = `CERT-${randomUUID().split('-')[0].toUpperCase()}-${courseId.substring(0, 4).toUpperCase()}`;

  const { data: certificate, error } = await supabase
    .from("course_certificates")
    .insert({
      student_id: user.user.id,
      course_id: courseId,
      final_score: finalScore,
      certificate_code: certificateCode,
      // For now, certificate_url can just be a verifiable page link 
      certificate_url: `/certificate/${certificateCode}`
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/student/courses/${courseId}`);
  return certificate;
}

export async function verifyCertificate(certificateCode: string) {
  const supabase = await createClient();
  
  // Publicly verifiable, no auth required
  const { data: certificate, error } = await supabase
    .from("course_certificates")
    .select(`
      *,
      profiles (full_name),
      courses (title)
    `)
    .eq("certificate_code", certificateCode)
    .single();

  if (error || !certificate) {
    return null;
  }

  return certificate;
}
