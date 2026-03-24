import { z } from "zod";

// Auth Validation Schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  first_name: z.string().min(2, "First name must be at least 2 characters"),
  last_name: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Course Validation Schemas
export const createCourseSchema = z.object({
  title: z.string().min(5, "Course title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
});

// Research Proposal Validation
export const researchProposalSchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters"),
  description: z.string().min(50, "Description must be at least 50 characters"),
  keywords: z.array(z.string()).min(1, "At least one keyword is required"),
  expectedDuration: z.string().min(1, "Expected duration is required"),
});

// Startup Validation
export const startupSchema = z.object({
  name: z.string().min(3, "Startup name must be at least 3 characters"),
  pitch: z.string().min(20, "Pitch must be at least 20 characters").max(500, "Pitch must be at most 500 characters"),
  stage: z.enum(["Idea", "Prototype", "MVP", "Seed", "Growth"]),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
});

// Type exports for use in components
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type CreateCourseData = z.infer<typeof createCourseSchema>;
export type ResearchProposalData = z.infer<typeof researchProposalSchema>;
export type StartupData = z.infer<typeof startupSchema>;

// Validation helper function
export function getErrorMessage(error: unknown): string {
  if (error instanceof z.ZodError) {
    const zodError = error as any;
    return zodError.errors?.[0]?.message || "Validation error";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An error occurred";
}
