import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { streamText } from "ai";
import { google } from "@ai-sdk/google";

// POST /api/ai/teaching — AI Teaching Assistant for live sessions
// Understands: current course, module, lesson, presentation slide context
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        const {
            messages,
            context
        } = body as {
            messages: { role: "user" | "assistant"; content: string }[];
            context: {
                course_title?:    string;
                module_title?:    string;
                lesson_title?:    string;
                slide_title?:     string;
                slide_content?:   string;
                session_title?:   string;
            };
        };

        if (!messages || messages.length === 0) {
            return NextResponse.json({ error: "messages array is required" }, { status: 400 });
        }

        // Build rich system prompt with learning context
        const contextParts: string[] = [
            "You are the SomaFlow AI Teaching Assistant — a knowledgeable, encouraging, and pedagogically-aware learning companion.",
            "You are embedded directly inside a live virtual classroom session. Students ask you questions privately, without disrupting the class.",
            "",
            "Your role is to:",
            "- Explain concepts clearly and concisely, tailored to the student's level",
            "- Provide additional examples and analogies when asked",
            "- Simplify complex ideas without losing accuracy",
            "- Generate revision notes and summaries on request",
            "- Create practice questions to test understanding",
            "- Connect current concepts to real-world applications",
            "- Always be encouraging and supportive",
            "",
            "Current learning context:",
        ];

        if (context?.session_title)  contextParts.push(`- Live Session: "${context.session_title}"`);
        if (context?.course_title)   contextParts.push(`- Course: "${context.course_title}"`);
        if (context?.module_title)   contextParts.push(`- Module: "${context.module_title}"`);
        if (context?.lesson_title)   contextParts.push(`- Lesson: "${context.lesson_title}"`);
        if (context?.slide_title)    contextParts.push(`- Current Slide: "${context.slide_title}"`);

        if (context?.slide_content) {
            contextParts.push("", "Current slide content (use this as primary reference):");
            contextParts.push(context.slide_content.replace(/<[^>]*>/g, ' ').trim().slice(0, 800));
        }

        contextParts.push("", "Keep responses concise (3-5 sentences max) unless the student explicitly asks for detailed notes.");
        contextParts.push("Format your response in clear, readable markdown when helpful.");

        const systemPrompt = contextParts.join("\n");

        const result = streamText({
            model: google("gemini-2.0-flash"),
            system: systemPrompt,
            messages: messages.map(m => ({
                role: m.role,
                content: m.content,
            })),
            maxTokens: 1024,
            temperature: 0.7,
        });

        return result.toDataStreamResponse();
    } catch (error: any) {
        console.error("AI Teaching Assistant error:", error);
        return NextResponse.json({ error: "AI service error: " + (error.message || "Unknown error") }, { status: 500 });
    }
}
