"use client"

import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ChevronLeft,
    ChevronRight,
    PlayCircle,
    FileText,
    CheckCircle2,
    Clock,
    Maximize2,
    Volume2,
    Settings as SettingsIcon,
    Menu,
    X,
    ArrowLeft,
    Gamepad2
} from "lucide-react";
import { awardCourseCompletionDna } from "@/lib/actions/skills";
import { recordLessonAnalytics } from "@/lib/actions/analytics";
import { awardReputation } from "@/lib/actions/reputation";
import { createClient } from "@/lib/supabase/client";
import { AICopilot } from "@/components/AICopilot";
import { submitQuizAttempt } from "@/lib/actions/quiz";
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DOMPurify from "isomorphic-dompurify";

export default function LessonPlayerPage() {
    const { id, lessonId } = useParams();
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const quizIdParam = searchParams.get('quizId');
    const router = useRouter();
    const supabase = createClient();
    const [lesson, setLesson] = useState<any>(null);
    const [course, setCourse] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [completedLessons, setCompletedLessons] = useState<string[]>([]);
    const [completedQuizzes, setCompletedQuizzes] = useState<string[]>([]);
    const [completing, setCompleting] = useState(false);
    const [courseCompleted, setCourseCompleted] = useState(false);
    const [courseJustFinished, setCourseJustFinished] = useState<{ isNew: boolean } | null>(null);

    // Telemetry tracking
    const startTimeRef = useRef<number>(0);

    const isHtmlContent = (value: string) => /<\s*[a-z][\s\S]*>/i.test(value);

    const renderLessonContent = (value: string) => {
        if (!value) return null;

        if (isHtmlContent(value)) {
            const sanitizedContent = DOMPurify.sanitize(value, {
                USE_PROFILES: { html: true },
            });

            return (
                <div
                    className="tiptap-rendered-content text-foreground/90 leading-relaxed font-medium"
                    dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                />
            );
        }

        return (
            <div className="text-foreground/90 leading-relaxed font-medium space-y-4">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {value}
                </ReactMarkdown>
            </div>
        );
    };

    useEffect(() => {
        startTimeRef.current = Date.now();
    }, [lessonId]);

    // Helper functions
    const getEmbedUrl = (url: string) => {
        if (!url) return '';
        const lowerUrl = url.toLowerCase();

        // YouTube
        if (lowerUrl.includes('youtube.com/watch')) {
            const urlParams = new URLSearchParams(new URL(url).search);
            return `https://www.youtube.com/embed/${urlParams.get('v')}`;
        }
        if (lowerUrl.includes('youtu.be/')) {
            const id = url.split('youtu.be/')[1].split('?')[0];
            return `https://www.youtube.com/embed/${id}`;
        }

        // Vimeo
        if (lowerUrl.includes('vimeo.com/')) {
            const id = url.split('vimeo.com/')[1].split('?')[0];
            return `https://player.vimeo.com/video/${id}`;
        }

        // Assuming it's already an embed link or mp4
        return url;
    };

    type PlaylistItem = { type: 'lesson' | 'quiz', id: string, title?: string, module_id: string, module_index: number };

    const playlist = useMemo(() => {
        if (!course?.modules) return [];
        const items: PlaylistItem[] = [];
        course.modules.forEach((m: any, mIdx: number) => {
            (m.lessons || []).forEach((l: any) => {
                items.push({ type: 'lesson', id: l.id, title: l.title, module_id: m.id, module_index: mIdx });
            });
            if (m.quiz) {
                items.push({ type: 'quiz', id: m.quiz.id, title: 'Module Knowledge Check', module_id: m.id, module_index: mIdx });
            }
        });
        return items;
    }, [course]);

    const currentItemIndex = useMemo(() => {
        return playlist.findIndex(item => 
            item.type === 'lesson' ? item.id === lessonId : (item.type === 'quiz' && item.id === quizIdParam)
        );
    }, [playlist, lessonId, quizIdParam]);

    const prevItem = currentItemIndex > 0 ? playlist[currentItemIndex - 1] : null;
    const nextItem = currentItemIndex !== -1 && currentItemIndex < playlist.length - 1 ? playlist[currentItemIndex + 1] : null;

    const isLocked = useMemo(() => {
        if (courseCompleted) return false;
        const currentItem = currentItemIndex !== -1 ? playlist[currentItemIndex] : null;
        if (!currentItem) return false;
        
        // If we are in module 1+ (0-indexed mIdx > 0), the previous module's quiz MUST be passed.
        if (currentItem.module_index > 0) {
            const prevModule = course.modules[currentItem.module_index - 1];
            if (prevModule?.quiz && !completedQuizzes.includes(prevModule.quiz.id)) {
                return true;
            }
        }
        return false;
    }, [playlist, currentItemIndex, course, completedQuizzes, courseCompleted]);
    useEffect(() => {
        const fetchLesson = async () => {
            try {
                // 1. Core fetch: lesson + course (no quiz join to avoid FK cache issues)
                const isQuizRoute = lessonId === "quiz";
                const [lessonRes, courseRes] = await Promise.all([
                    !isQuizRoute
                        ? supabase.from("lessons").select("*, modules(*)").eq("id", lessonId as string).single()
                        : Promise.resolve({ data: null, error: null }),
                    supabase.from("courses")
                        .select("*, modules(*, lessons(*))")
                        .eq("id", id as string)
                        .single(),
                ]);

                if (lessonRes.error && !isQuizRoute) {
                    console.error("Lesson fetch error:", JSON.stringify(lessonRes.error));
                    throw lessonRes.error;
                }
                if (courseRes.error) {
                    console.error("Course fetch error:", JSON.stringify(courseRes.error));
                    throw courseRes.error;
                }

                // 2. Soft-fail: fetch quizzes separately and merge onto modules
                try {
                    if (courseRes.data?.modules?.length) {
                        const moduleIds = courseRes.data.modules.map((m: any) => m.id);
                        const { data: quizData } = await supabase
                            .from("quizzes")
                            .select("*, quiz_questions(*, quiz_options(id, option_text))")
                            .in("module_id", moduleIds);

                        if (quizData) {
                            courseRes.data.modules.forEach((m: any) => {
                                const moduleQuizzes = quizData.filter((q: any) => q.module_id === m.id);
                                m.quizzes = moduleQuizzes;
                                if (moduleQuizzes.length > 0) {
                                    m.quiz = moduleQuizzes[0];
                                    if (m.quiz?.quiz_questions) {
                                        m.quiz.quiz_questions.sort((a: any, b: any) =>
                                            (a.position ?? a.order_index ?? 0) - (b.position ?? b.order_index ?? 0)
                                        );
                                    }
                                }
                            });
                        }
                    }
                } catch (_quizErr) {
                    // Quiz tables may not be set up yet — lesson page still works without them
                    console.warn("Quiz fetch skipped (tables may not exist yet):", _quizErr);
                }

                // 3. Soft-fail: lesson progress AND quiz progress
                let progressRes: any = null;
                let quizSubsRes: any = null;
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        progressRes = await supabase
                            .from("user_lesson_progress")
                            .select('lesson_id')
                            .eq("course_id", id as string)
                            .eq("user_id", user.id);
                            
                        quizSubsRes = await supabase
                            .from("quiz_attempts")
                            .select('quiz_id, score, quizzes!inner(passing_score)')
                            .eq("student_id", user.id)
                            .eq("status", "graded");
                    }
                } catch (_progressErr) {
                    // Table may not exist; ignore and continue
                }

                if (progressRes && progressRes.data) {
                    setCompletedLessons(progressRes.data.map((p: any) => p.lesson_id));
                }
                if (quizSubsRes && quizSubsRes.data) {
                    const passedQuizzes = quizSubsRes.data
                        .filter((q: any) => q.score >= q.quizzes.passing_score)
                        .map((q: any) => q.quiz_id);
                    setCompletedQuizzes(passedQuizzes);
                }

                let authorized = false;
                const { data: { user: currentUser } } = await supabase.auth.getUser();

                if (currentUser) {
                    if (currentUser.id === courseRes.data.instructor_id) {
                        authorized = true;
                    } else {
                        const { data: profile } = await supabase.from("profiles").select("role").eq("id", currentUser.id).single();
                        if (profile?.role === 'admin' || profile?.role === 'super_admin') {
                            authorized = true;
                        }

                        // Allow BOTH active and completed students to revisit
                        const { data: enrollment } = await supabase
                            .from("course_enrollments")
                            .select("*")
                            .eq("course_id", id as string)
                            .eq("user_id", currentUser.id)
                            .in("status", ["active", "completed"])
                            .single();

                        if (enrollment) {
                            authorized = true;
                            // Set revisit mode if already completed
                            if (enrollment.status === 'completed') {
                                setCourseCompleted(true);
                            }
                        }
                    }
                }

                if (!authorized) {
                    router.push(`/courses/${id}`);
                    return;
                }

                setIsAuthorized(true);
                setLesson(lessonRes.data);
                // Sort modules and lessons by order_index
                if (courseRes.data?.modules) {
                    courseRes.data.modules.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));
                    courseRes.data.modules.forEach((m: any) => {
                        if (m.lessons) m.lessons.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));
                        // Note: m.quiz is already merged + sorted by the quiz soft-fail block above
                    });
                }
                setCourse(courseRes.data);

            } catch (error) {
                console.error("Error fetching lesson:", error);
            } finally {
                setLoading(false);
            }
        };

        if (lessonId && id) {
            fetchLesson();

            if (lessonId !== 'quiz') {
                const channel = supabase.channel(`lesson_${lessonId}_updates`)
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'lessons', filter: `id=eq.${lessonId}` }, () => {
                        fetchLesson();
                    })
                    .subscribe();

                return () => {
                    supabase.removeChannel(channel);
                };
            }
        }
    }, [lessonId, id, quizIdParam]);

    const markLessonComplete = async (navigateToNext: boolean) => {
        if (!lessonId || completing || !course) return;
        setCompleting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const isAlreadyCompleted = completedLessons.includes(lessonId as string);

            if (!isAlreadyCompleted) {
                const { error } = await supabase.from('user_lesson_progress').insert({
                    user_id: user.id,
                    course_id: id as string,
                    lesson_id: lessonId as string
                });

                if (error && error.code !== '23505') { // ignore unique violation if they rapidly click
                    throw error;
                }

                setCompletedLessons(prev => [...prev, lessonId as string]);

                // Record Telemetry
                const timeSpentSecs = Math.round((Date.now() - startTimeRef.current) / 1000);
                await recordLessonAnalytics(user.id, lessonId as string, timeSpentSecs, 0, 0, true);
            }

            if (navigateToNext && nextItem) {
                if (nextItem.type === 'lesson') {
                    router.push(`/courses/${id}/lessons/${nextItem.id}`);
                } else {
                    router.push(`/courses/${id}/lessons/quiz?quizId=${nextItem.id}`);
                }
            } else if (navigateToNext && !nextItem) {
                // Course finished - Gamification Rewards
                try {
                    // Award Course Completion Badge
                    const { data: existingBadge } = await supabase.from('badges').select('id').eq('user_id', user.id).eq('name', 'Course Completed').eq('course_id', id as string).limit(1);
                    if (!existingBadge || existingBadge.length === 0) {
                        await supabase.from('badges').insert({
                            user_id: user.id,
                            name: 'Course Completed',
                            description: `Finished: ${course.title}`,
                            course_id: id as string,
                            icon_url: 'award',
                            type: 'course_completion'
                        });

                        // Award 100 Completion Tokens
                        await supabase.from('token_transactions').insert({
                            user_id: user.id,
                            amount: 100,
                            reason: `Completed Course: ${course.title}`
                        });

                        // Update Token Balance
                        const { data: balData } = await supabase.from('user_tokens').select('total_balance').eq('user_id', user.id).single();
                        if (balData) {
                            await supabase.from('user_tokens').update({ total_balance: balData.total_balance + 100 }).eq('user_id', user.id);
                        } else {
                            await supabase.from('user_tokens').insert({ user_id: user.id, total_balance: 100 });
                        }

                        // Award Skill DNA Points
                        await awardCourseCompletionDna(user.id, id as string);

                        // Award Reputation Points
                        await awardReputation(user.id, 50, `Completed Course: ${course.title}`);

                        setCourseJustFinished({ isNew: true });
                    } else {
                        setCourseJustFinished({ isNew: false });
                    }

                    // Mark enrollment as completed (enables revisit mode)
                    const { data: { user: u } } = await supabase.auth.getUser();
                    if (u) {
                        await supabase.from('course_enrollments')
                            .update({ status: 'completed', completed_at: new Date().toISOString() })
                            .eq('course_id', id as string)
                            .eq('user_id', u.id);
                        setCourseCompleted(true);
                    }
                } catch (gamificationErr) {
                    console.error("Error awarding course completion gamification:", gamificationErr);
                }
            }
        } catch (error) {
            console.error("Error marking lesson complete:", error);
            alert("Failed to mark lesson as complete.");
        } finally {
            setCompleting(false);
        }
    };

    const progressPercent = playlist.filter(i => i.type === 'lesson').length > 0 
        ? Math.round((completedLessons.length / playlist.filter(i => i.type === 'lesson').length) * 100) 
        : 0;
    const isCompleted = completedLessons.includes(lessonId as string);
    const canFinish = completedLessons.length === playlist.filter(i => i.type === 'lesson').length || (completedLessons.length === playlist.filter(i => i.type === 'lesson').length - 1 && !isCompleted);

    if (loading) {
        return <div className="p-8 text-center animate-pulse text-muted-foreground font-medium uppercase tracking-widest text-xs">Loading lesson...</div>;
    }

    if (!isAuthorized) {
        return <div className="p-8 text-center">Redirecting...</div>;
    }

    if (isLocked) {
        return (
            <div className="flex h-[calc(100vh-64px)] overflow-hidden -m-8 relative items-center justify-center bg-background/50">
                <div className="premium-card p-12 text-center max-w-md w-full space-y-6">
                    <div className="w-20 h-20 rounded-full bg-accent/30 mx-auto flex items-center justify-center border border-border/50">
                        <svg className="w-10 h-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold font-outfit">Module Locked</h2>
                    <p className="text-muted-foreground font-medium">
                        You must complete the previous module's <span className="text-hub-rose font-bold">Knowledge Check</span> before accessing this content.
                    </p>
                    <button
                        onClick={() => router.push(`/courses/${id}`)}
                        className="px-6 py-3 bg-accent text-foreground hover:bg-accent/80 rounded-xl font-bold transition-all w-full"
                    >
                        Back to Syllabus
                    </button>
                </div>
            </div>
        );
    }

    if (courseJustFinished) {
        return (
            <div className="flex h-[calc(100vh-64px)] overflow-hidden -m-8 relative items-center justify-center bg-background/50">
                <div className="premium-card p-12 text-center max-w-lg w-full space-y-6 flex flex-col items-center animate-in fade-in zoom-in duration-500 shadow-2xl">
                    <div className="w-24 h-24 rounded-full bg-hub-teal/10 text-hub-teal flex items-center justify-center mb-4">
                        <CheckCircle2 className="w-12 h-12" />
                    </div>
                    {courseJustFinished.isNew ? (
                        <>
                            <h2 className="text-3xl font-bold font-outfit text-foreground">Course Completed!</h2>
                            <p className="text-muted-foreground font-medium text-lg leading-relaxed">
                                🎉 Congratulations! You completed the course and earned <span className="text-hub-rose font-bold">100 Learning Tokens</span>, a new Badge, and Skill DNA points!
                            </p>
                            <div className="bg-hub-rose/10 border border-hub-rose/20 rounded-xl p-4 inline-flex items-center gap-3">
                                <Gamepad2 className="w-5 h-5 text-hub-rose animate-pulse" />
                                <span className="font-bold text-hub-rose">+100 Learning Tokens Earned!</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <h2 className="text-3xl font-bold font-outfit text-foreground">Course Re-Visited!</h2>
                            <p className="text-muted-foreground font-medium text-lg leading-relaxed">
                                🎉 Great job re-visiting your course material!
                            </p>
                        </>
                    )}
                    <div className="pt-6 w-full">
                        <button
                            onClick={() => router.push(`/courses/${id}`)}
                            className="w-full px-6 py-4 bg-hub-teal text-white hover:bg-hub-teal/90 rounded-xl font-bold tracking-wide transition-all shadow-xl shadow-hub-teal/20"
                        >
                            Return to Syllabus
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!lesson && !quizIdParam) {
        return <div className="p-8 text-center">Lesson not found.</div>;
    }

    // Secondary deep check, only for actual lessons
    if (!quizIdParam && (!lesson || !lesson.modules)) {
        return (
            <div className="p-8 text-center">
                <p className="text-muted-foreground">Lesson not found.</p>
            </div>
        );
    }

    const currentQuizModule = quizIdParam ? course?.modules?.find((m: any) => m.quiz?.id === quizIdParam) : null;
    const moduleOrderIndex = quizIdParam ? currentQuizModule?.order_index : lesson?.modules?.order_index;

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden -m-8 relative">
            {/* Sidebar Toggle (Mobile) */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="absolute top-4 left-4 z-50 p-2 bg-background/80 backdrop-blur border border-border/50 rounded-lg lg:hidden"
            >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto bg-background p-8 lg:p-12 space-y-8">
                <div className="max-w-4xl mx-auto space-y-8">
                    <button
                        onClick={() => router.push(`/courses/${id}`)}
                        className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-hub-indigo transition-colors group mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Syllabus
                    </button>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold uppercase tracking-widest bg-hub-indigo/10 text-hub-indigo px-2 py-1 rounded border border-hub-indigo/10">
                                Module {(moduleOrderIndex ?? 0) + 1}
                            </span>
                            {!quizIdParam && lesson && (
                                <span className="text-muted-foreground text-xs font-bold uppercase tracking-widest">
                                    Lesson {lesson.order_index + 1}
                                </span>
                            )}
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-outfit font-bold tracking-tight">
                            {quizIdParam ? currentQuizModule?.quiz?.title : lesson?.title}
                        </h1>
                    </div>

                    {quizIdParam ? (
                        <QuizView quiz={currentQuizModule?.quiz} courseId={id as string} />
                    ) : (
                        <>
                            {/* Media Player Placeholder */}
                            <div className="aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl shadow-indigo-500/10 border border-white/5 relative group">
                                {lesson.video_url ? (
                                    <iframe
                                        src={getEmbedUrl(lesson.video_url)}
                                        className="w-full h-full"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-accent/20">
                                        <FileText className="w-16 h-16 text-muted-foreground/20" />
                                        <span className="absolute bottom-6 left-12 text-xs font-bold text-muted-foreground uppercase tracking-widest">Interactive Reading</span>
                                    </div>
                                )}
                            </div>

                            {/* Lesson Content */}
                            <article className="prose prose-invert max-w-none pb-20">
                                <div className="premium-card p-8 bg-accent/10 border-border/30 overflow-hidden">
                                    {lesson.content ? (
                                        renderLessonContent(lesson.content)
                                    ) : (
                                        <p className="text-lg text-foreground/90 leading-relaxed font-medium">
                                            No detailed content available for this lesson. Please refer to the video and attached resources.
                                        </p>
                                    )}
                                </div>
                            </article>

                            {/* Revisit Mode Banner */}
                            {courseCompleted && (
                                <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-hub-teal/10 border border-hub-teal/20 text-hub-teal font-bold text-sm">
                                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                                    <div>
                                        <p className="font-outfit font-bold">Course Completed — Revisit Mode</p>
                                        <p className="text-xs text-hub-teal/70 font-medium mt-0.5">You've earned your badge. Browse the content freely.</p>
                                    </div>
                                </div>
                            )}

                            {/* Navigation Buttons */}
                            <div className="flex items-center justify-between border-t border-border/50 pt-8 pb-12">
                                <button
                                    onClick={() => {
                                        if (prevItem) {
                                            if (prevItem.type === 'lesson') router.push(`/courses/${id}/lessons/${prevItem.id}`);
                                            else router.push(`/courses/${id}/lessons/quiz?quizId=${prevItem.id}`);
                                        }
                                    }}
                                    disabled={!prevItem}
                                    className={cn("flex items-center gap-3 px-6 py-3 rounded-xl border transition-all group font-bold text-sm",
                                        prevItem ? "border-border/50 hover:bg-accent text-foreground" : "border-transparent opacity-50 cursor-not-allowed")}
                                >
                                    <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                                    Previous
                                </button>

                                {courseCompleted ? (
                                    // Revisit mode: pure navigation, no progress tracking
                                    nextItem ? (
                                        <button
                                            onClick={() => {
                                                if (nextItem.type === 'lesson') router.push(`/courses/${id}/lessons/${nextItem.id}`);
                                                else router.push(`/courses/${id}/lessons/quiz?quizId=${nextItem.id}`);
                                            }}
                                            className="flex items-center gap-3 px-8 py-3 rounded-xl bg-hub-teal/10 text-hub-teal border border-hub-teal/20 hover:bg-hub-teal/20 transition-all font-bold text-sm active:scale-95"
                                        >
                                            {nextItem.type === 'quiz' ? 'Knowledge Check' : 'Next Lesson'}
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => router.push(`/courses/${id}`)}
                                            className="flex items-center gap-3 px-8 py-3 rounded-xl bg-hub-teal/10 text-hub-teal border border-hub-teal/20 hover:bg-hub-teal/20 transition-all font-bold text-sm active:scale-95"
                                        >
                                            <CheckCircle2 className="w-5 h-5" />
                                            Back to Course
                                        </button>
                                    )
                                ) : nextItem ? (
                                    <button
                                        onClick={() => markLessonComplete(true)}
                                        disabled={completing}
                                        className="flex items-center gap-3 px-8 py-3 rounded-xl bg-hub-indigo text-white hover:bg-hub-indigo/90 transition-all font-bold text-sm shadow-xl shadow-hub-indigo/20 active:scale-95 disabled:opacity-50"
                                    >
                                        {completing ? "Saving..." : isCompleted ? (nextItem.type === 'quiz' ? 'Knowledge Check' : 'Next Lesson') : "Complete & Continue"}
                                        {!completing && <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => markLessonComplete(true)}
                                        disabled={!canFinish || completing}
                                        className={cn("flex items-center gap-3 px-8 py-3 rounded-xl transition-all font-bold text-sm shadow-xl",
                                            canFinish ? "bg-hub-teal text-white hover:bg-hub-teal/90 shadow-hub-teal/20 active:scale-95" : "bg-accent text-muted-foreground opacity-50 cursor-not-allowed shadow-none")}
                                    >
                                        <CheckCircle2 className="w-5 h-5" />
                                        {completing ? "Finishing..." : "Finish Course"}
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Sidebar (Right) */}
            <aside className={cn(
                "w-80 border-l border-border bg-card/50 backdrop-blur-xl shrink-0 transition-all duration-300 fixed inset-y-0 right-0 z-40 lg:static lg:translate-x-0 translate-x-full",
                sidebarOpen && "translate-x-0"
            )}>
                <div className="p-6 h-full flex flex-col">
                    <div className="space-y-4 mb-6">
                        <h2 className="text-lg font-outfit font-bold">Course Playlist</h2>
                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                <span>Progress</span>
                                <span>{completedLessons.length} / {playlist.filter(i => i.type === 'lesson').length} Completed</span>
                            </div>
                            <div className="h-1.5 w-full bg-accent rounded-full overflow-hidden border border-border/50">
                                <div className="h-full bg-hub-indigo transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-6 scrollbar-hide">
                        {course?.modules?.map((m: any, idx: number) => {
                            const isModuleLocked = !courseCompleted && idx > 0 && course.modules[idx - 1]?.quiz && !completedQuizzes.includes(course.modules[idx - 1].quiz.id);
                            
                            return (
                                <div key={m.id} className={cn("space-y-2", isModuleLocked && "opacity-50 pointer-events-none")}>
                                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-2 flex items-center justify-between">
                                        <span>Module {idx + 1}: {m.title}</span>
                                        {isModuleLocked && <span title="Locked - Complete previous module's quiz">🔒</span>}
                                    </h3>
                                    <div className="space-y-1">
                                        {m.lessons?.map((l: any) => (
                                            <button
                                                key={l.id}
                                                onClick={() => router.push(`/courses/${id}/lessons/${l.id}`)}
                                                className={cn(
                                                "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all text-xs font-medium group",
                                                l.id === lessonId
                                                    ? "bg-hub-indigo/10 text-hub-indigo border border-hub-indigo/20 shadow-sm"
                                                    : "hover:bg-accent text-muted-foreground hover:text-foreground border border-transparent"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-6 h-6 rounded-full flex items-center justify-center shrink-0 border",
                                                l.id === lessonId ? "bg-hub-indigo text-white border-hub-indigo" : "bg-accent border-border/50 group-hover:border-muted-foreground"
                                            )}>
                                                {l.id === lessonId ? <PlayCircle className="w-3.5 h-3.5" /> : <div className="text-[10px] font-bold">{l.order_index + 1}</div>}
                                            </div>
                                            <span className="flex-1 line-clamp-1">{l.title}</span>
                                            {completedLessons.includes(l.id) && <CheckCircle2 className="w-4 h-4 text-hub-teal" />}
                                            {!completedLessons.includes(l.id) && l.id !== lessonId && <CheckCircle2 className="w-3.5 h-3.5 opacity-20" />}
                                        </button>
                                    ))}
                                    {m.quiz && (
                                        <button
                                            onClick={() => router.push(`/courses/${id}/lessons/quiz?quizId=${m.quiz.id}`)}
                                            className={cn(
                                                "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all text-xs font-medium group mt-2",
                                                quizIdParam === m.quiz.id
                                                    ? "bg-hub-rose/10 text-hub-rose border border-hub-rose/20 shadow-sm"
                                                    : "bg-hub-rose/5 text-hub-rose/80 hover:bg-hub-rose/10 hover:text-hub-rose border border-transparent"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-6 h-6 rounded-full flex items-center justify-center shrink-0 border",
                                                quizIdParam === m.quiz.id ? "bg-hub-rose text-white border-hub-rose" : "bg-hub-rose/10 border-hub-rose/20"
                                            )}>
                                                <Gamepad2 className="w-3.5 h-3.5" />
                                            </div>
                                            <span className="flex-1 font-bold line-clamp-1">Knowledge Check</span>
                                            {completedQuizzes.includes(m.quiz.id) && <CheckCircle2 className="w-4 h-4 text-hub-rose" />}
                                            {!completedQuizzes.includes(m.quiz.id) && quizIdParam !== m.quiz.id && <CheckCircle2 className="w-3.5 h-3.5 opacity-20" />}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )})}
                    </div>
                </div>
            </aside>

            {/* AI Copilot Widget */}
            {lesson && course && <AICopilot lessonId={lesson.id} courseId={course.id} />}
        </div>
    );
}

// Sub-component for rendering the Quiz UI
function QuizView({ quiz, courseId }: { quiz: any; courseId: string }) {
    const supabase = createClient();
    const router = useRouter();
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<any>(null); // { score, passed, earned_tokens }
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    useEffect(() => {
        if (quiz?.time_limit && !result) {
            setTimeLeft(quiz.time_limit * 60); // Assuming time_limit is in minutes
        }
    }, [quiz?.time_limit, result]);

    useEffect(() => {
        if (timeLeft === null || submitting || result) return;
        
        if (timeLeft <= 0) {
            handleSubmit(true);
            return;
        }

        const timer = setInterval(() => setTimeLeft(prev => prev !== null ? prev - 1 : null), 1000);
        return () => clearInterval(timer);
    }, [timeLeft, submitting, result]);

    useEffect(() => {
        const checkExisting = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data } = await supabase.from('quiz_attempts')
                .select('score, quizzes!inner(passing_score)')
                .eq('student_id', user.id)
                .eq('quiz_id', quiz.id)
                .eq('status', 'graded')
                .order('score', { ascending: false })
                .limit(1);
                
            if (data && data.length > 0) {
                const quiz_ = Array.isArray(data[0].quizzes) ? data[0].quizzes[0] : data[0].quizzes;
                if (quiz_ && data[0].score >= quiz_.passing_score) {
                    setResult({ passed: true, score: data[0].score, earned_tokens: 0 });
                }
            }
        };
        checkExisting();
    }, [quiz.id, supabase]);

    if (!quiz || !quiz.quiz_questions) return <div className="p-8 text-center text-muted-foreground">Quiz data is missing.</div>;

    const questions = quiz.quiz_questions;

    const handleSubmit = async (isAutoSubmit?: boolean | React.SyntheticEvent) => {
        const autoSubmit = isAutoSubmit === true;
        if (Object.keys(answers).length < questions.length && !autoSubmit) {
            alert("Please answer all questions before submitting.");
            return;
        }

        setSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { alert("Not authenticated."); return; }

            const res = await submitQuizAttempt(user.id, quiz.id, answers);
            if (res.error) throw new Error(res.error);

            setResult({
                passed: res.passed,
                score: res.score,
                earned_tokens: res.earnedTokens
            });
        } catch (error: any) {
            console.error("Error submitting quiz:", error);
            alert(error?.message || "Failed to submit quiz.");
        } finally {
            setSubmitting(false);
        }
    };

    if (result) {
        return (
            <div className="premium-card p-12 text-center space-y-6 flex flex-col items-center">
                <div className={cn("w-20 h-20 rounded-full flex items-center justify-center mb-4", result.passed ? "bg-hub-teal/10 text-hub-teal" : "bg-hub-rose/10 text-hub-rose")}>
                    {result.passed ? <CheckCircle2 className="w-10 h-10" /> : <X className="w-10 h-10" />}
                </div>
                <h2 className="text-3xl font-outfit font-bold">{result.passed ? "Quiz Passed!" : "Quiz Failed"}</h2>
                <p className="text-muted-foreground font-medium">You scored <span className="text-foreground font-bold">{result.score}%</span> on this knowledge check.</p>
                <p className="text-muted-foreground text-sm">Passing Score: {quiz.passing_score}%</p>

                {result.earned_tokens > 0 && (
                    <div className="bg-hub-rose/10 border border-hub-rose/20 rounded-xl p-4 inline-flex items-center gap-3 animate-pulse">
                        <Gamepad2 className="w-5 h-5 text-hub-rose" />
                        <span className="font-bold text-hub-rose">+{result.earned_tokens} Learning Tokens Earned!</span>
                    </div>
                )}

                <div className="pt-8">
                    {result.passed ? (
                        <button onClick={() => router.push(`/courses/${courseId}`)} className="px-8 py-3 bg-hub-teal text-white rounded-xl font-bold shadow-xl shadow-hub-teal/20 active:scale-95 transition-all">
                            Back to Course
                        </button>
                    ) : (
                        <button onClick={() => { setResult(null); setAnswers({}); }} className="px-8 py-3 bg-hub-rose text-white rounded-xl font-bold shadow-xl shadow-hub-rose/20 active:scale-95 transition-all">
                            Try Again
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="premium-card p-8 border-hub-rose/30 space-y-8">
            <div className="flex items-center gap-3 text-hub-rose bg-hub-rose/10 px-4 py-2 rounded-lg inline-flex font-bold text-sm tracking-widest uppercase">
                <Gamepad2 className="w-4 h-4" /> Knowledge Check
            </div>

            <div className="flex items-center justify-between">
                <p className="text-muted-foreground font-medium">Answer the following {questions.length} questions to test your knowledge. Passing score is {quiz.passing_score}%.</p>
                {timeLeft !== null && (
                    <div className={cn("flex items-center gap-2 px-4 py-2 rounded-xl font-bold border shrink-0", timeLeft < 60 ? "bg-hub-rose/10 text-hub-rose border-hub-rose/20 animate-pulse" : "bg-accent/20 text-foreground border-border/50")}>
                        <Clock className="w-4 h-4" />
                        {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                    </div>
                )}
            </div>

            <div className="space-y-8 pt-4">
                {questions.map((q: any, idx: number) => (
                    <div key={q.id} className="space-y-4">
                        <h4 className="font-outfit font-bold text-lg flex items-start gap-4">
                            <span className="text-muted-foreground shrink-0">{idx + 1}.</span> {q.question_text}
                        </h4>
                        <div className="pl-8 space-y-3">
                            {q.quiz_options.map((opt: any) => (
                                <button
                                    key={opt.id}
                                    onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt.id }))}
                                    className={cn(
                                        "w-full text-left px-5 py-4 rounded-xl border transition-all font-medium flex items-center gap-4 group",
                                        answers[q.id] === opt.id ? "bg-hub-rose/10 border-hub-rose/50 text-hub-rose" : "bg-accent/20 border-border hover:bg-accent/40 hover:border-border/80 text-foreground/80"
                                    )}
                                >
                                    <div className={cn(
                                        "w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                                        answers[q.id] === opt.id ? "border-hub-rose bg-hub-rose" : "border-muted-foreground/50 group-hover:border-foreground"
                                    )}>
                                        {answers[q.id] === opt.id && <div className="w-2 h-2 rounded-full bg-white" />}
                                    </div>
                                    <span>{opt.option_text}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-end pt-8 border-t border-border/50">
                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="px-8 py-3 bg-hub-indigo text-white rounded-xl font-bold shadow-xl shadow-hub-indigo/20 flex items-center gap-2 active:scale-95 transition-all disabled:opacity-60"
                >
                    {submitting ? "Grading..." : "Submit Answers"}
                </button>
            </div>
        </div>
    );
}
