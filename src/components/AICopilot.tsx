"use client";

import { useState, useRef, useEffect, ChangeEvent, FormEvent } from 'react';
import { Bot, X, Send, User, BrainCircuit, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

// Custom lightweight hook to cleanly handle pure text streams from toTextStreamResponse
function useChatCustom({ api, body }: { api: string, body?: any }) {
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = { id: Date.now().toString(), role: 'user', content: input };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput("");
        setIsLoading(true);

        try {
            const res = await fetch(api, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...body, messages: newMessages })
            });

            if (!res.ok) throw new Error("Failed to fetch");

            const reader = res.body?.getReader();
            const decoder = new TextDecoder();
            let aiContent = "";

            const aiMessageId = Date.now().toString() + '-ai';

            if (!reader) return;

            setMessages([...newMessages, { id: aiMessageId, role: 'assistant', content: aiContent }]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                aiContent += decoder.decode(value, { stream: true });
                setMessages([...newMessages, { id: aiMessageId, role: 'assistant', content: aiContent }]);
            }
        } catch (error) {
            console.error("Chat Error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return { messages, input, handleInputChange, handleSubmit, isLoading };
}

interface AICopilotProps {
    lessonId?: string;
    courseId?: string;
}

export function AICopilot({ lessonId, courseId }: AICopilotProps) {
    const [isOpen, setIsOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    const { messages, input, handleInputChange, handleSubmit, isLoading } = useChatCustom({
        api: '/api/chat',
        body: { lessonId, courseId }
    });

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-6 py-4 bg-hub-indigo text-white rounded-full font-bold shadow-2xl hover:bg-hub-indigo/90 transition-all hover:-translate-y-1 group border border-white/10"
            >
                <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
                Ask AI Copilot
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm sm:max-w-md h-[600px] max-h-[80vh] flex flex-col bg-card border border-border/50 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-accent/30">
                <div className="flex items-center gap-2 text-hub-indigo font-bold">
                    <BrainCircuit className="w-5 h-5" />
                    Merux LMS Copilot
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-white/10 rounded-lg text-muted-foreground transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {(!messages || messages.length === 0) && (
                    <div className="text-center space-y-4 my-auto h-full flex flex-col items-center justify-center opacity-50">
                        <Bot className="w-12 h-12 text-hub-indigo mx-auto" />
                        <p className="text-sm font-medium">I'm your AI tutor. Ask me to explain concepts, summarize this lesson, or generate practice questions!</p>
                    </div>
                )}
                
                {(messages || []).map((m: any) => (
                    <div key={m.id} className={cn("flex gap-3", m.role === 'user' ? "flex-row-reverse" : "")}>
                        <div className={cn(
                            "w-8 h-8 shrink-0 rounded-full flex items-center justify-center",
                            m.role === 'user' ? "bg-hub-indigo/20 text-hub-indigo" : "bg-hub-teal/20 text-hub-teal"
                        )}>
                            {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>
                        <div className={cn(
                            "px-4 py-3 rounded-2xl max-w-[80%] prose prose-invert prose-sm",
                            m.role === 'user' 
                                ? "bg-hub-indigo text-white rounded-tr-sm" 
                                : "bg-accent/50 text-foreground rounded-tl-sm"
                        )}>
                            <ReactMarkdown>{m.content}</ReactMarkdown>
                        </div>
                    </div>
                ))}
                
                {isLoading && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 shrink-0 rounded-full bg-hub-teal/20 text-hub-teal flex items-center justify-center">
                            <Bot className="w-4 h-4" />
                        </div>
                        <div className="px-4 py-3 rounded-2xl bg-accent/50 text-muted-foreground rounded-tl-sm flex gap-1 items-center h-10">
                            <span className="w-2 h-2 rounded-full bg-current animate-bounce" />
                            <span className="w-2 h-2 rounded-full bg-current animate-bounce delay-75" />
                            <span className="w-2 h-2 rounded-full bg-current animate-bounce delay-150" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

        {/* Input Form */}
            <div className="p-4 bg-background border-t border-border/50">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        value={input || ''}
                        onChange={handleInputChange}
                        placeholder="Ask about this lesson..."
                        className="flex-1 bg-accent/50 border border-border/50 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-hub-indigo/50 text-sm"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !(input || '').trim()}
                        className="p-3 bg-hub-indigo text-white rounded-xl hover:bg-hub-indigo/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    );
}
