import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 30;

export async function POST(req: Request) {
    try {
        const { messages, lessonId, courseId } = await req.json();

        const supabase = await createClient();

        // 1. Fetch contextual information if lessonId exists
        let lessonContext = "";
        let courseTitle = "MTIH Learn Course";

        if (lessonId && courseId) {
            const [lessonRes, courseRes] = await Promise.all([
                supabase.from('lessons').select('title, content').eq('id', lessonId).single(),
                supabase.from('courses').select('title').eq('id', courseId).single()
            ]);

            if (courseRes.data) {
                courseTitle = courseRes.data.title;
            }

            if (lessonRes.data) {
                lessonContext = `
Current Lesson Title: ${lessonRes.data.title}
Lesson Content Context: 
${lessonRes.data.content ? lessonRes.data.content.substring(0, 5000) : 'No specific text content.'}
`;
            }
        }

        // 2. Define the System Prompt
        const systemPrompt = `You are a helpful, expert AI Learning Copilot embedded inside MeruX (formerly MTIH Learn), an advanced Learning Management System.
Your job is to act as a private tutor for the student taking the course "${courseTitle}".

Here is the context of the exact lesson they are looking at right now:
${lessonContext}

Guidelines:
1. Be encouraging, concise, and helpful.
2. If they ask about the lesson material, use the provided context to answer accurately. 
3. If they ask to summarize, provide clear bullet points.
4. If they ask for practice questions, generate 2-3 tailored questions based on the lesson.
5. If they ask something completely unrelated to technology, programming, or the course, politely guide them back to the learning material.
6. Use markdown formatting to make your answers easy to read (bolding, code blocks, lists).
`;

        // 3. Native Fetch to Gemini REST API
        const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?key=${process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY}&alt=sse`;
        
        // Format messages for Google's official API
        const geminiMessages = messages.map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
        }));

        const payload = {
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: geminiMessages,
            generationConfig: { maxOutputTokens: 2000 }
        };

        const response = await fetch(geminiApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Gemini API Error: ${errText}`);
        }

        // 4. Transform Google's Server-Sent Events into a readable text chunk stream
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        const transformStream = new TransformStream({
            async transform(chunk, controller) {
                const text = decoder.decode(chunk);
                const lines = text.split('\n');
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.replace('data: ', '').trim();
                        if (dataStr === '[DONE]') continue;
                        
                        try {
                            const data = JSON.parse(dataStr);
                            const textPart = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                            if (textPart) {
                                controller.enqueue(encoder.encode(textPart));
                            }
                        } catch (e) {
                            // Ignore incomplete JSON chunks in SSE stream gracefully
                        }
                    }
                }
            }
        });

        return new Response(response.body?.pipeThrough(transformStream), {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    } catch (error: any) {
        console.error("AI Copilot Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
