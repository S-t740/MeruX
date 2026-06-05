import { createClient } from '@/lib/supabase/server';

export const maxDuration = 120;

const ALLOWED_ROLES = ['instructor', 'admin', 'super_admin'];

// ── Strip markdown fences if Gemini wraps JSON in ```json ... ``` ──────────────
function extractJSON(raw: string): string {
    const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) return fenceMatch[1].trim();
    // Find first { and last } as fallback
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start !== -1 && end !== -1) return raw.slice(start, end + 1);
    return raw.trim();
}

export async function POST(req: Request) {
    try {
        // ── 1. Auth & Role Guard ────────────────────────────────────────────────
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || !ALLOWED_ROLES.includes(profile.role)) {
            return Response.json({ error: 'Forbidden: Instructor or Admin role required.' }, { status: 403 });
        }

        // ── 2. Parse & Validate Request Body ──────────────────────────────────
        const { courseTitle, moduleTitle, lessonTitle, difficulty, rawNotes } = await req.json();

        if (!courseTitle || !moduleTitle || !lessonTitle || !rawNotes) {
            return Response.json({ error: 'Missing required fields: courseTitle, moduleTitle, lessonTitle, rawNotes.' }, { status: 400 });
        }

        if (rawNotes.trim().length < 50) {
            return Response.json({ error: 'Raw notes must be at least 50 characters.' }, { status: 400 });
        }

        // ── 3. Build SomaFlow Standardized JSON Prompt ─────────────────────────
        const systemPrompt = `You are an expert instructional designer, curriculum architect, and content standardization specialist for a modern LMS called SomaFlow.

Your task is to transform raw instructor notes into a STRUCTURED INTERACTIVE LESSON as a single valid JSON object.

CRITICAL RULES:
- Output ONLY valid JSON. No markdown, no explanations, no code fences, no extra text.
- Every block must have a unique "id" string (e.g. "block-01", "block-02").
- Maintain professional, instructional tone (Cisco Academy style).
- Do NOT hallucinate facts. If information is missing, use an "instructor_note" block.
- Use double quotes only. No trailing commas.
- Ensure all 17 required sections appear in the exact order specified.`;

        const userPrompt = `Transform these raw instructor notes into the SomaFlow standardized lesson JSON.

INPUTS:
- Course Title: ${courseTitle}
- Module Title: ${moduleTitle}
- Lesson Title: ${lessonTitle}
- Difficulty: ${difficulty || 'beginner'}
- Raw Notes:
${rawNotes}

---

OUTPUT: A single valid JSON object matching this EXACT schema. Follow the section ORDER strictly.

{
  "metadata": {
    "course": "${courseTitle}",
    "module": "${moduleTitle}",
    "lesson": "${lessonTitle}",
    "difficulty": "${difficulty || 'beginner'}",
    "estimated_time_minutes": <number>,
    "prerequisites": ["..."],
    "tags": ["..."],
    "learning_outcomes": ["...start with action verbs..."]
  },
  "blocks": [
    SECTION 1 — Lesson Title Heading:
    { "id": "block-01", "type": "heading", "data": { "text": "<Lesson Title>" } },

    SECTION 2 — Lesson Overview (engaging 3–5 line introduction with a real-world hook):
    { "id": "block-02", "type": "paragraph", "data": { "text": "<overview text>" } },

    SECTION 3 — Learning Outcomes (subheading + callout with info variant listing 4–8 bullet point outcomes):
    { "id": "block-03", "type": "subheading", "data": { "text": "Learning Outcomes" } },
    { "id": "block-04", "type": "callout", "data": { "variant": "info", "title": "What You Will Learn", "text": "• Outcome 1\n• Outcome 2\n..." } },

    SECTION 4 — Prerequisites (callout with warning variant):
    { "id": "block-05", "type": "callout", "data": { "variant": "warning", "title": "Prerequisites", "text": "..." } },

    SECTION 5 — Key Concepts (subheading + multiple paragraph/callout blocks, one per key concept with definition, explanation, example, common mistake):
    { "id": "block-06", "type": "subheading", "data": { "text": "Key Concepts" } },
    ...concept blocks...

    SECTION 6 — Real-World Use Cases (subheading + paragraph blocks with 2–3 scenarios):
    { "id": "block-N", "type": "subheading", "data": { "text": "Real-World Use Cases" } },
    ...scenario paragraph blocks...

    SECTION 7 — Comparison Table (minimum 1 table comparing key items):
    { "id": "block-N", "type": "table", "data": { "title": "...", "columns": [...], "rows": [[...]] } },

    SECTION 8 — Suggested Visuals (2 image_prompt blocks):
    { "id": "block-N", "type": "image_prompt", "data": { "title": "...", "prompt": "...", "purpose": "...", "style": "infographic" } },
    { "id": "block-N", "type": "image_prompt", "data": { "title": "...", "prompt": "...", "purpose": "...", "style": "flow diagram" } },

    SECTION 9 — Flashcards (minimum 8 cards):
    { "id": "block-N", "type": "flashcards", "data": { "title": "Flashcards", "cards": [{ "question": "...", "answer": "..." }, ...] } },

    SECTION 10 — Quick Knowledge Check (5 questions, mix MCQ + true_false):
    { "id": "block-N", "type": "quiz", "data": { "title": "Quick Knowledge Check", "time_limit_minutes": 10, "questions": [...] } },

    SECTION 11 — Fill in the Blank (minimum 3 items):
    { "id": "block-N", "type": "fill_blank", "data": { "title": "Fill in the Blank", "items": [{ "sentence": "The ______ is...", "answer": "..." }] } },

    SECTION 12 — Cisco-Style Lab Task (1 lab block):
    { "id": "block-N", "type": "lab", "data": { "title": "...", "objective": "...", "requirements": [...], "steps": [...], "expected_output": [...], "submission_instructions": "..." } },

    SECTION 13 — Exam Style Questions (minimum 5 questions):
    { "id": "block-N", "type": "exam_questions", "data": { "title": "Exam Style Questions", "questions": [...] } },

    SECTION 14 — Lesson Recap (5–10 bullet points):
    { "id": "block-N", "type": "recap", "data": { "title": "Lesson Recap", "points": ["...", "..."] } },

    SECTION 15 — Glossary (10–15 terms):
    { "id": "block-N", "type": "glossary", "data": { "title": "Glossary", "terms": [{ "term": "...", "definition": "..." }] } },

    SECTION 16 — Next Lesson Bridge (2–4 sentences):
    { "id": "block-N", "type": "next_lesson", "data": { "text": "..." } },

    SECTION 17 — Instructor Review Checklist:
    { "id": "block-N", "type": "checklist", "data": { "title": "Instructor Review Checklist", "items": [
      { "text": "Technical accuracy verified", "checked": false },
      { "text": "Examples align with course context", "checked": false },
      { "text": "Quiz answers reviewed", "checked": false },
      { "text": "Lab task is feasible for students", "checked": false },
      { "text": "Estimated time is realistic", "checked": false },
      { "text": "Lesson structure follows SomaFlow standard", "checked": true }
    ] } }
  ]
}

Return ONLY the JSON object. No preamble, no explanation, no markdown fences.`;

        // ── 4. Call Gemini (non-streaming for reliable JSON) ────────────────────
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        const payload = {
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            generationConfig: {
                maxOutputTokens: 16384,
                temperature: 0.4,
                responseMimeType: 'application/json'
            }
        };

        const geminiResponse = await fetch(geminiApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!geminiResponse.ok) {
            const errText = await geminiResponse.text();
            throw new Error(`Gemini API Error (${geminiResponse.status}): ${errText}`);
        }

        const geminiData = await geminiResponse.json();
        const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!rawText) {
            throw new Error('Gemini returned an empty response. The prompt may have been blocked or the model failed to generate content.');
        }

        // ── 5. Extract & Validate JSON ─────────────────────────────────────────
        const jsonStr = extractJSON(rawText);

        let lessonJSON: unknown;
        try {
            lessonJSON = JSON.parse(jsonStr);
        } catch {
            console.error('[Lesson Generator] Failed to parse JSON:', jsonStr.slice(0, 500));
            throw new Error('The AI model returned malformed JSON. Please try again or simplify your raw notes.');
        }

        return Response.json({ success: true, lesson: lessonJSON });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        console.error('[AI Lesson Generator Error]', message);
        return Response.json({ error: message }, { status: 500 });
    }
}
