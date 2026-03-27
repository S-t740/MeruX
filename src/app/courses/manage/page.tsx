"use client"

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    Plus, Trash2, GripVertical, BookOpen, FileText, ClipboardCheck,
    ChevronDown, ChevronUp, Save, Loader2, ArrowLeft, Video, X,
    Calendar, Pencil, Check, ArrowUp, ArrowDown, Gamepad2, Camera
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/auth-context";
import { cn } from "@/lib/utils";
import { RichTextEditor } from "@/components/editor/RichTextEditor";

import { Suspense } from "react";

function CourseBuilderContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const courseId = searchParams.get("id");
    const { user } = useAuth();
    const supabase = createClient();

    const [course, setCourse] = useState<any>(null);
    const [modules, setModules] = useState<any[]>([]);
    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [expandedModules, setExpandedModules] = useState<string[]>([]);
    const [showEditCourseInfo, setShowEditCourseInfo] = useState(false);
    const [editCourseInfo, setEditCourseInfo] = useState({ title: "", description: "", thumbnail_url: "" });
    const [uploadingImage, setUploadingImage] = useState(false);

    // Inline editing states
    const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
    const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
    const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
    const [editingContentId, setEditingContentId] = useState<string | null>(null);
    const [editContentData, setEditContentData] = useState({ content: "", video_url: "" });

    // New item forms
    const [newModule, setNewModule] = useState({ title: "", description: "" });
    const [showNewModule, setShowNewModule] = useState(false);
    const [newLesson, setNewLesson] = useState({ title: "", content: "", video_url: "", moduleId: "" });
    const [showNewLesson, setShowNewLesson] = useState<string | null>(null);
    const [newAssignment, setNewAssignment] = useState({ title: "", description: "", due_date: "", max_score: 100 });
    const [showNewAssignment, setShowNewAssignment] = useState(false);

    // Quiz forms
    const [showQuizEditor, setShowQuizEditor] = useState<string | null>(null); // module id
    const [editingQuiz, setEditingQuiz] = useState<any>({
        title: "Module Quiz",
        passing_score: 80,
        questions: [{ question_text: "", points: 10, options: [{ option_text: "", is_correct: true }, { option_text: "", is_correct: false }] }]
    });
    const [activeModuleId, setActiveModuleId] = useState<string | null>(null);

    const scrollPositionRef = useRef(0);
    const contextHydratedRef = useRef(false);

    const storageKey = courseId ? `course-builder-context:${courseId}` : "";

    const captureScrollPosition = () => {
        if (typeof window === "undefined") return;
        scrollPositionRef.current = window.scrollY;
    };

    const restoreScrollPosition = () => {
        if (typeof window === "undefined") return;
        window.requestAnimationFrame(() => {
            window.scrollTo({ top: scrollPositionRef.current, behavior: "auto" });
        });
    };

    const findModuleIdByLessonId = (lessonId: string) => {
        for (const moduleItem of modules) {
            if ((moduleItem.lessons || []).some((lesson: any) => lesson.id === lessonId)) {
                return moduleItem.id as string;
            }
        }
        return null;
    };

    const fetchCourseData = useCallback(async () => {
        if (!courseId) return;
        try {
            const [courseRes, modulesRes, assignmentsRes] = await Promise.all([
                supabase.from("courses").select("*").eq("id", courseId).single(),
                supabase.from("modules").select("*, lessons(*), quizzes(*, quiz_questions(*, quiz_options(*)))").eq("course_id", courseId).order("order_index"),
                supabase.from("assignments").select("*").eq("course_id", courseId).order("created_at")
            ]);

            if (courseRes.error) throw courseRes.error;
            setCourse(courseRes.data);
            setEditCourseInfo({
                title: courseRes.data.title || "",
                description: courseRes.data.description || "",
                thumbnail_url: courseRes.data.thumbnail_url || ""
            });

            const mods = modulesRes.data || [];
            mods.forEach((m: any) => {
                if (m.lessons) m.lessons.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));
                if (m.quizzes && m.quizzes.length > 0) {
                    // Extract the single quiz
                    m.quiz = m.quizzes[0];
                    if (m.quiz && m.quiz.quiz_questions) {
                        m.quiz.quiz_questions.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));
                    }
                }
            });
            setModules(mods);
            setExpandedModules(prev => {
                const valid = prev.filter(id => mods.some((m: any) => m.id === id));
                if (valid.length > 0) return valid;
                if (activeModuleId && mods.some((m: any) => m.id === activeModuleId)) return [activeModuleId];
                return mods.length > 0 ? [mods[0].id] : [];
            });

            setAssignments(assignmentsRes.data || []);
        } catch (err) {
            console.error("Error loading course:", err);
        } finally {
            setLoading(false);
        }
    }, [activeModuleId, courseId, supabase]);

    useEffect(() => {
        if (!storageKey || contextHydratedRef.current || typeof window === "undefined") return;
        const raw = window.localStorage.getItem(storageKey);
        if (!raw) {
            contextHydratedRef.current = true;
            return;
        }

        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed.expandedModules)) setExpandedModules(parsed.expandedModules);
            if (typeof parsed.activeModuleId === "string") setActiveModuleId(parsed.activeModuleId);
            if (typeof parsed.showNewLesson === "string") setShowNewLesson(parsed.showNewLesson);
            if (typeof parsed.showQuizEditor === "string") setShowQuizEditor(parsed.showQuizEditor);
            if (typeof parsed.editingContentId === "string") setEditingContentId(parsed.editingContentId);
            if (typeof parsed.scrollY === "number") scrollPositionRef.current = parsed.scrollY;
        } catch (error) {
            console.error("Failed to hydrate course builder context", error);
        } finally {
            contextHydratedRef.current = true;
        }
    }, [storageKey]);

    useEffect(() => {
        if (!storageKey || typeof window === "undefined") return;
        window.localStorage.setItem(
            storageKey,
            JSON.stringify({
                expandedModules,
                activeModuleId,
                showNewLesson,
                showQuizEditor,
                editingContentId,
                scrollY: scrollPositionRef.current,
            })
        );
    }, [activeModuleId, editingContentId, expandedModules, showNewLesson, showQuizEditor, storageKey]);

    useEffect(() => { fetchCourseData(); }, [fetchCourseData]);

    const saveCourseInfo = async () => {
        if (!editCourseInfo.title.trim()) return;
        setSaving(true);
        captureScrollPosition();
        try {
            const { error } = await supabase.from('courses').update({
                title: editCourseInfo.title,
                description: editCourseInfo.description,
                thumbnail_url: editCourseInfo.thumbnail_url
            }).eq('id', courseId);
            if (error) throw error;
            setShowEditCourseInfo(false);
            setCourse((prev: any) => ({ ...prev, ...editCourseInfo }));
        } catch (err: any) {
            console.error("Save course info error:", err);
            alert(`Failed to update course info: ${err.message || JSON.stringify(err)}`);
        } finally {
            setSaving(false);
            restoreScrollPosition();
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${courseId}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('course-thumbnails')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('course-thumbnails')
                .getPublicUrl(filePath);

            setEditCourseInfo(p => ({ ...p, thumbnail_url: publicUrl }));
        } catch (error: any) {
            console.error("Upload Error:", error);
            alert(`Failed to upload image: ${error.message}`);
        } finally {
            setUploadingImage(false);
        }
    };

    // --- MODULE CRUD ---
    const addModule = async () => {
        if (!newModule.title.trim()) return;
        setSaving(true);
        captureScrollPosition();
        try {
            const { data, error } = await supabase.from("modules").insert({
                course_id: courseId,
                title: newModule.title,
                description: newModule.description,
                order_index: modules.length
            }).select().single();
            if (error) throw error;
            setNewModule({ title: "", description: "" });
            setShowNewModule(false);
            if (data) {
                const nextModule = { ...data, lessons: [], quizzes: [], quiz: null };
                setModules(prev => [...prev, nextModule]);
                setExpandedModules(prev => [...new Set([...prev, nextModule.id])]);
                setActiveModuleId(nextModule.id);
            }
        } catch (err: any) { console.error(err); alert("Failed to add module: " + (err.message || JSON.stringify(err))); }
        finally {
            setSaving(false);
            restoreScrollPosition();
        }
    };

    const deleteModule = async (moduleId: string) => {
        if (!confirm("Delete this module and all its lessons?")) return;
        captureScrollPosition();
        try {
            const { error } = await supabase.from("modules").delete().eq("id", moduleId);
            if (error) throw error;
            setModules(prev => prev.filter(mod => mod.id !== moduleId));
            setExpandedModules(prev => prev.filter(id => id !== moduleId));
            if (activeModuleId === moduleId) setActiveModuleId(null);
        } catch (err) { console.error(err); }
        finally { restoreScrollPosition(); }
    };

    const updateModule = async (moduleId: string, updates: any) => {
        captureScrollPosition();
        try {
            const { error } = await supabase.from("modules").update(updates).eq("id", moduleId);
            if (error) throw error;
            setEditingModuleId(null);
            setModules(prev => prev.map(mod => mod.id === moduleId ? { ...mod, ...updates } : mod));
            setActiveModuleId(moduleId);
        } catch (err) { console.error(err); }
        finally { restoreScrollPosition(); }
    };

    // --- LESSON CRUD ---
    const addLesson = async (moduleId: string) => {
        if (!newLesson.title.trim()) return;
        setSaving(true);
        captureScrollPosition();
        const mod = modules.find(m => m.id === moduleId);
        try {
            const { data, error } = await supabase.from("lessons").insert({
                module_id: moduleId,
                title: newLesson.title,
                content: newLesson.content,
                video_url: newLesson.video_url || null,
                order_index: mod?.lessons?.length || 0
            }).select().single();
            if (error) throw error;
            setNewLesson({ title: "", content: "", video_url: "", moduleId: "" });
            setShowNewLesson(null);
            if (data) {
                setModules(prev => prev.map(moduleItem => {
                    if (moduleItem.id !== moduleId) return moduleItem;
                    const lessons = [...(moduleItem.lessons || []), data];
                    lessons.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));
                    return { ...moduleItem, lessons };
                }));
            }
            setActiveModuleId(moduleId);
        } catch (err: any) { console.error(err); alert("Failed to add lesson: " + (err.message || JSON.stringify(err))); }
        finally {
            setSaving(false);
            restoreScrollPosition();
        }
    };

    const deleteLesson = async (lessonId: string) => {
        if (!confirm("Delete this lesson?")) return;
        captureScrollPosition();
        try {
            const { error } = await supabase.from("lessons").delete().eq("id", lessonId);
            if (error) throw error;
            const moduleId = findModuleIdByLessonId(lessonId);
            setModules(prev => prev.map(moduleItem => ({
                ...moduleItem,
                lessons: (moduleItem.lessons || []).filter((lesson: any) => lesson.id !== lessonId),
            })));
            if (editingContentId === lessonId) setEditingContentId(null);
            if (editingLessonId === lessonId) setEditingLessonId(null);
            if (moduleId) setActiveModuleId(moduleId);
        } catch (err) { console.error(err); }
        finally { restoreScrollPosition(); }
    };

    const updateLesson = async (lessonId: string, updates: any) => {
        captureScrollPosition();
        try {
            const { error } = await supabase.from("lessons").update(updates).eq("id", lessonId);
            if (error) throw error;
            setEditingLessonId(null);
            const moduleId = findModuleIdByLessonId(lessonId);
            setModules(prev => prev.map(moduleItem => ({
                ...moduleItem,
                lessons: (moduleItem.lessons || []).map((lesson: any) => lesson.id === lessonId ? { ...lesson, ...updates } : lesson),
            })));
            if (moduleId) setActiveModuleId(moduleId);
        } catch (err) { console.error(err); }
        finally { restoreScrollPosition(); }
    };

    const saveLessonContent = async (lessonId: string) => {
        captureScrollPosition();
        try {
            setSaving(true);
            const { error } = await supabase.from('lessons').update({
                content: editContentData.content,
                video_url: editContentData.video_url
            }).eq('id', lessonId);
            if (error) throw error;
            const moduleId = findModuleIdByLessonId(lessonId);
            setModules(prev => prev.map(moduleItem => ({
                ...moduleItem,
                lessons: (moduleItem.lessons || []).map((lesson: any) => lesson.id === lessonId ? {
                    ...lesson,
                    content: editContentData.content,
                    video_url: editContentData.video_url,
                } : lesson),
            })));
            if (moduleId) setActiveModuleId(moduleId);
        } catch (err: any) { console.error(err); alert("Failed to save content: " + (err.message || JSON.stringify(err))); }
        finally {
            setSaving(false);
            restoreScrollPosition();
        }
    };

    const moveModule = async (index: number, direction: 'up' | 'down') => {
        if ((direction === 'up' && index === 0) || (direction === 'down' && index === modules.length - 1)) return;
        const newModules = [...modules];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;

        const tempOrder = newModules[index].order_index;
        newModules[index].order_index = newModules[swapIndex].order_index;
        newModules[swapIndex].order_index = tempOrder;

        const temp = newModules[index];
        newModules[index] = newModules[swapIndex];
        newModules[swapIndex] = temp;
        setModules(newModules);

        try {
            await Promise.all([
                supabase.from('modules').update({ order_index: newModules[index].order_index }).eq('id', newModules[index].id),
                supabase.from('modules').update({ order_index: newModules[swapIndex].order_index }).eq('id', newModules[swapIndex].id)
            ]);
        } catch (err) { console.error(err); fetchCourseData(); }
    };

    const moveLesson = async (moduleId: string, lessonIndex: number, direction: 'up' | 'down') => {
        const moduleIdx = modules.findIndex(m => m.id === moduleId);
        if (moduleIdx === -1) return;
        const mod = modules[moduleIdx];
        const lessons = [...(mod.lessons || [])];
        if ((direction === 'up' && lessonIndex === 0) || (direction === 'down' && lessonIndex === lessons.length - 1)) return;

        const swapIndex = direction === 'up' ? lessonIndex - 1 : lessonIndex + 1;
        const tempOrder = lessons[lessonIndex].order_index;
        lessons[lessonIndex].order_index = lessons[swapIndex].order_index;
        lessons[swapIndex].order_index = tempOrder;

        const temp = lessons[lessonIndex];
        lessons[lessonIndex] = lessons[swapIndex];
        lessons[swapIndex] = temp;

        const newModules = [...modules];
        newModules[moduleIdx] = { ...mod, lessons };
        setModules(newModules);

        try {
            await Promise.all([
                supabase.from('lessons').update({ order_index: lessons[lessonIndex].order_index }).eq('id', lessons[lessonIndex].id),
                supabase.from('lessons').update({ order_index: lessons[swapIndex].order_index }).eq('id', lessons[swapIndex].id)
            ]);
        } catch (err) { console.error(err); fetchCourseData(); }
    };

    // --- QUIZ CRUD ---
    const saveQuiz = async (moduleId: string) => {
        setSaving(true);
        captureScrollPosition();
        try {
            // Filter out questions that have no text (allow instructor to save without filling every blank)
            const validQuestions = editingQuiz.questions.filter((q: any) => q.question_text.trim());

            if (validQuestions.length === 0) {
                alert("Please add at least one question with text before saving.");
                return;
            }

            // For each valid question, validate options
            for (const q of validQuestions) {
                const filledOptions = q.options.filter((o: any) => o.option_text.trim());
                if (filledOptions.length < 2) {
                    alert(`Question "${q.question_text.substring(0, 40)}..." must have at least 2 options with text.`);
                    return;
                }
                if (!filledOptions.some((o: any) => o.is_correct)) {
                    alert(`Question "${q.question_text.substring(0, 40)}..." must have one correct option marked.`);
                    return;
                }
            }

            // Upsert Quiz
            const mod = modules.find(m => m.id === moduleId);
            let quizId = mod?.quiz?.id;

            if (quizId) {
                await supabase.from("quizzes").update({ title: editingQuiz.title, passing_score: editingQuiz.passing_score }).eq("id", quizId);
            } else {
                const { data, error } = await supabase.from("quizzes").insert({
                    module_id: moduleId,
                    course_id: course?.id,
                    title: editingQuiz.title,
                    passing_score: editingQuiz.passing_score,
                    type: 'module'
                }).select().single();
                if (error) throw error;
                quizId = data.id;
            }

            // Delete old questions/options (cascade will handle options)
            if (mod?.quiz?.id) {
                await supabase.from("quiz_questions").delete().eq("quiz_id", quizId);
            }

            // Insert new valid questions
            for (let i = 0; i < validQuestions.length; i++) {
                const q = validQuestions[i];
                const { data: qData, error: qErr } = await supabase.from("quiz_questions").insert({
                    quiz_id: quizId,
                    question_text: q.question_text,
                    points: q.points,
                    question_type: 'mcq',
                    position: i
                }).select().single();
                if (qErr) throw qErr;

                // Insert only options that have text
                const optionInserts = q.options
                    .filter((o: any) => o.option_text.trim())
                    .map((o: any) => ({
                        question_id: qData.id,
                        option_text: o.option_text,
                        is_correct: o.is_correct
                    }));
                if (optionInserts.length > 0) {
                    await supabase.from("quiz_options").insert(optionInserts);
                }
            }

            setShowQuizEditor(null);
            fetchCourseData();
        } catch (error: any) {
            console.error("Error saving quiz:", error);
            alert(error.message || "Failed to save quiz");
        } finally {
            setSaving(false);
            setActiveModuleId(moduleId);
            restoreScrollPosition();
        }
    };

    // --- ASSIGNMENT CRUD ---
    const addAssignment = async () => {
        if (!newAssignment.title.trim()) return;
        setSaving(true);
        try {
            const { data, error } = await supabase.from("assignments").insert({
                course_id: courseId,
                title: newAssignment.title,
                description: newAssignment.description,
                due_date: newAssignment.due_date || null,
                max_score: newAssignment.max_score
            }).select().single();
            if (error) throw error;
            setNewAssignment({ title: "", description: "", due_date: "", max_score: 100 });
            setShowNewAssignment(false);
            if (data) setAssignments(prev => [...prev, data]);
        } catch (err) { console.error(err); alert("Failed to add assignment"); }
        finally { setSaving(false); }
    };

    const deleteAssignment = async (assignmentId: string) => {
        if (!confirm("Delete this assignment?")) return;
        try {
            const { error } = await supabase.from("assignments").delete().eq("id", assignmentId);
            if (error) throw error;
            setAssignments(prev => prev.filter(assignment => assignment.id !== assignmentId));
        } catch (err) { console.error(err); }
    };

    const updateAssignment = async (assignmentId: string, updates: any) => {
        try {
            const { error } = await supabase.from("assignments").update(updates).eq("id", assignmentId);
            if (error) throw error;
            setEditingAssignmentId(null);
            setAssignments(prev => prev.map(assignment => assignment.id === assignmentId ? { ...assignment, ...updates } : assignment));
        } catch (err) { console.error(err); }
    };

    const toggleModule = (id: string) => {
        setActiveModuleId(id);
        setExpandedModules(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
    };

    if (loading) {
        return <div className="p-12 text-center animate-pulse text-muted-foreground font-medium uppercase tracking-widest text-xs">Loading Course Builder...</div>;
    }

    if (!course) {
        return (
            <div className="p-12 text-center space-y-4">
                <p className="text-muted-foreground">Course not found.</p>
                <button onClick={() => router.back()} className="text-hub-indigo font-bold hover:underline">Go back</button>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <button onClick={() => router.push(`/courses/${courseId}`)} className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-hub-indigo transition-colors group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Course
            </button>

            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-border/50 pb-8">
                <div className="page-header mb-0 flex-1 relative">
                    <div className="flex items-center gap-2 text-sm font-bold text-hub-indigo uppercase tracking-widest mb-2">
                        <BookOpen className="w-4 h-4" /> Course Builder
                    </div>
                    {showEditCourseInfo ? (
                        <div className="space-y-4 bg-accent/10 p-5 rounded-2xl border border-border/50 mt-4 max-w-2xl">
                            <h3 className="text-sm font-bold text-hub-indigo uppercase tracking-widest">Edit Course Settings</h3>
                            <input value={editCourseInfo.title} onChange={e => setEditCourseInfo(p => ({ ...p, title: e.target.value }))} placeholder="Course Title" className="w-full bg-accent/30 border border-border/50 px-3 py-2 rounded-lg text-lg font-bold focus:outline-none focus:ring-2 focus:ring-hub-indigo/50 transition-all font-outfit" />
                            <textarea value={editCourseInfo.description} onChange={e => setEditCourseInfo(p => ({ ...p, description: e.target.value }))} placeholder="Course Description" rows={2} className="w-full bg-accent/30 border border-border/50 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-hub-indigo/50 resize-none transition-all" />

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Thumbnail / Background Image</label>
                                {editCourseInfo.thumbnail_url ? (
                                    <div className="relative w-full h-32 rounded-xl overflow-hidden border border-border/50 group">
                                        <img src={editCourseInfo.thumbnail_url} alt="Thumbnail preview" className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => setEditCourseInfo(p => ({ ...p, thumbnail_url: "" }))}
                                            className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-rose-500/90 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all font-bold backdrop-blur-md"
                                            title="Remove Image"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative w-full border-2 border-dashed border-border/50 rounded-xl p-6 flex flex-col items-center justify-center gap-2 hover:bg-accent/30 hover:border-hub-indigo/50 transition-all cursor-pointer">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            disabled={uploadingImage}
                                        />
                                        {uploadingImage ? (
                                            <>
                                                <Loader2 className="w-6 h-6 animate-spin text-hub-indigo" />
                                                <span className="text-xs font-bold text-muted-foreground">Uploading...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Camera className="w-6 h-6 text-muted-foreground" />
                                                <span className="text-xs font-bold text-muted-foreground">Click or drag image to upload</span>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button onClick={() => setShowEditCourseInfo(false)} className="px-4 py-2 bg-accent rounded-lg text-xs font-bold hover:bg-accent/80 transition-all">Cancel</button>
                                <button onClick={saveCourseInfo} disabled={saving} className="px-5 py-2 bg-hub-indigo text-white rounded-lg text-xs font-bold hover:bg-hub-indigo/90 transition-all disabled:opacity-50 flex items-center gap-2">
                                    {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save Details
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="group inline-block pr-12 relative cursor-pointer" onClick={() => setShowEditCourseInfo(true)} title="Click to edit course details">
                            <h1 className="page-title group-hover:text-hub-indigo transition-colors">{course.title}</h1>
                            <p className="page-description max-w-2xl">{course.description}</p>
                            {course.thumbnail_url && (
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-2 flex items-center gap-1">
                                    <Check className="w-3 h-3 text-hub-teal" /> Custom Background Image Set
                                </p>
                            )}
                            <button className="absolute top-2 right-0 p-2 bg-accent/50 hover:bg-hub-indigo/10 rounded-lg text-muted-foreground hover:text-hub-indigo transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center">
                                <Pencil className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-3 text-xs pt-2">
                    <span className={cn(
                        "px-3 py-1.5 rounded-full font-bold uppercase tracking-widest border",
                        course.status === 'Published' ? "bg-hub-teal/10 text-hub-teal border-hub-teal/20" : "bg-hub-amber/10 text-hub-amber border-hub-amber/20"
                    )}>{course.status}</span>
                    <span className="text-muted-foreground font-bold">{modules.length} Modules • {modules.reduce((a, m) => a + (m.lessons?.length || 0), 0)} Lessons • {assignments.length} Assignments</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Modules & Lessons */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-outfit font-bold flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-hub-indigo" /> Modules & Lessons
                        </h2>
                        <button onClick={() => setShowNewModule(true)} className="inline-flex items-center gap-1.5 px-4 py-2 bg-hub-indigo text-white rounded-xl font-bold text-xs hover:bg-hub-indigo/90 transition-all active:scale-95 shadow-lg shadow-hub-indigo/20">
                            <Plus className="w-3.5 h-3.5" /> Add Module
                        </button>
                    </div>

                    {/* New Module Form */}
                    {showNewModule && (
                        <div className="premium-card p-6 space-y-4 border-hub-indigo/30 bg-hub-indigo/5">
                            <h3 className="text-sm font-bold font-outfit uppercase tracking-widest text-hub-indigo">New Module</h3>
                            <input value={newModule.title} onChange={e => setNewModule(p => ({ ...p, title: e.target.value }))}
                                placeholder="Module title..." className="w-full bg-accent/30 border border-border/50 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-hub-indigo/50 transition-all" />
                            <input value={newModule.description} onChange={e => setNewModule(p => ({ ...p, description: e.target.value }))}
                                placeholder="Brief description (optional)..." className="w-full bg-accent/30 border border-border/50 px-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-hub-indigo/50 transition-all" />
                            <div className="flex gap-2">
                                <button onClick={() => setShowNewModule(false)} className="px-4 py-2 bg-accent rounded-xl text-sm font-bold hover:bg-accent/80 transition-all">Cancel</button>
                                <button onClick={addModule} disabled={saving} className="px-4 py-2 bg-hub-indigo text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-hub-indigo/90 transition-all disabled:opacity-60">
                                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Add
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Module List */}
                    <div className="space-y-4">
                        {modules.map((mod, idx) => (
                            <div key={mod.id} className="premium-card overflow-hidden p-0">
                                {/* Module Header */}
                                <div className="flex items-center justify-between p-5 hover:bg-accent/20 transition-all">
                                    <button onClick={() => toggleModule(mod.id)} className="flex items-center gap-3 flex-1 text-left group">
                                        <div className="w-8 h-8 rounded-lg bg-hub-indigo/10 flex items-center justify-center text-hub-indigo font-bold text-sm">{idx + 1}</div>
                                        {editingModuleId === mod.id ? (
                                            <EditableField value={mod.title} onSave={(val) => updateModule(mod.id, { title: val })} onCancel={() => setEditingModuleId(null)} />
                                        ) : (
                                            <div>
                                                <h3 className="font-outfit font-bold group-hover:text-hub-indigo transition-colors">{mod.title}</h3>
                                                <p className="text-xs text-muted-foreground font-medium">{mod.lessons?.length || 0} Lessons</p>
                                            </div>
                                        )}
                                    </button>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => moveModule(idx, 'up')} disabled={idx === 0} className="p-1 hover:bg-accent rounded disabled:opacity-30"><ArrowUp className="w-3 h-3 text-muted-foreground" /></button>
                                        <button onClick={() => moveModule(idx, 'down')} disabled={idx === modules.length - 1} className="p-1 hover:bg-accent rounded disabled:opacity-30"><ArrowDown className="w-3 h-3 text-muted-foreground" /></button>
                                        <button onClick={() => setEditingModuleId(mod.id)} className="p-2 hover:bg-accent rounded-lg transition-colors" title="Edit"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                                        <button onClick={() => deleteModule(mod.id)} className="p-2 hover:bg-hub-rose/10 rounded-lg transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5 text-hub-rose" /></button>
                                        {expandedModules.includes(mod.id) ? <ChevronUp className="w-4 h-4 text-muted-foreground ml-1" /> : <ChevronDown className="w-4 h-4 text-muted-foreground ml-1" />}
                                    </div>
                                </div>

                                {/* Expanded: Lessons */}
                                {expandedModules.includes(mod.id) && (
                                    <div className="border-t border-border/50 bg-accent/5">
                                        {mod.lessons?.map((lesson: any, lIdx: number) => (
                                            <div key={lesson.id} className="border-b border-border/20">
                                                <div className="flex items-center justify-between px-6 py-3 pl-14 hover:bg-accent/20 transition-all group">
                                                    <div className="flex items-center gap-3">
                                                        {lesson.video_url ? <Video className="w-4 h-4 text-hub-rose" /> : <FileText className="w-4 h-4 text-hub-teal" />}
                                                        {editingLessonId === lesson.id ? (
                                                            <EditableField value={lesson.title} onSave={(val) => updateLesson(lesson.id, { title: val })} onCancel={() => setEditingLessonId(null)} />
                                                        ) : (
                                                            <span className="text-sm font-medium">{lesson.title}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => moveLesson(mod.id, lIdx, 'up')} disabled={lIdx === 0} className="p-1 hover:bg-accent rounded disabled:opacity-30"><ArrowUp className="w-3 h-3 text-muted-foreground" /></button>
                                                        <button onClick={() => moveLesson(mod.id, lIdx, 'down')} disabled={lIdx === mod.lessons.length - 1} className="p-1 hover:bg-accent rounded disabled:opacity-30"><ArrowDown className="w-3 h-3 text-muted-foreground" /></button>
                                                        <button onClick={() => { setActiveModuleId(mod.id); setEditingContentId(lesson.id); setEditContentData({ content: lesson.content || "", video_url: lesson.video_url || "" }); }} className="p-1.5 hover:bg-accent rounded-lg transition-colors" title="Edit Content"><BookOpen className="w-3 h-3 text-hub-teal" /></button>
                                                        <button onClick={() => setEditingLessonId(lesson.id)} className="p-1.5 hover:bg-accent rounded-lg transition-colors" title="Rename"><Pencil className="w-3 h-3 text-muted-foreground" /></button>
                                                        <button onClick={() => deleteLesson(lesson.id)} className="p-1.5 hover:bg-hub-rose/10 rounded-lg transition-colors" title="Delete"><Trash2 className="w-3 h-3 text-hub-rose" /></button>
                                                    </div>
                                                </div>
                                                {editingContentId === lesson.id && (
                                                    <div className="p-4 pl-14 space-y-3 bg-accent/5">
                                                        <RichTextEditor
                                                            value={editContentData.content}
                                                            onChange={(value) => setEditContentData(p => ({ ...p, content: value }))}
                                                            placeholder="Write lesson content..."
                                                        />
                                                        <input value={editContentData.video_url} onChange={e => setEditContentData(p => ({ ...p, video_url: e.target.value }))}
                                                            placeholder="Video URL (optional)..." className="w-full bg-accent/30 border border-border/50 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-hub-teal/50 transition-all" />
                                                        <div className="flex gap-2">
                                                            <button onClick={() => setEditingContentId(null)} className="px-3 py-1.5 bg-accent rounded-lg text-xs font-bold">Cancel</button>
                                                            <button onClick={() => saveLessonContent(lesson.id)} disabled={saving} className="px-3 py-1.5 bg-hub-teal text-white rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-60">
                                                                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save Content
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        {/* Add Lesson */}
                                        {showNewLesson === mod.id ? (
                                            <div className="p-4 pl-14 space-y-3 bg-hub-teal/5 border-t border-hub-teal/20">
                                                <input value={newLesson.title} onChange={e => setNewLesson(p => ({ ...p, title: e.target.value }))}
                                                    placeholder="Lesson title..." className="w-full bg-accent/30 border border-border/50 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-hub-teal/50 transition-all" />
                                                <RichTextEditor
                                                    value={newLesson.content}
                                                    onChange={(value) => setNewLesson(p => ({ ...p, content: value }))}
                                                    placeholder="Write lesson content..."
                                                />
                                                <input value={newLesson.video_url} onChange={e => setNewLesson(p => ({ ...p, video_url: e.target.value }))}
                                                    placeholder="Video URL (optional)..." className="w-full bg-accent/30 border border-border/50 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-hub-teal/50 transition-all" />
                                                <div className="flex gap-2">
                                                    <button onClick={() => setShowNewLesson(null)} className="px-3 py-1.5 bg-accent rounded-lg text-xs font-bold">Cancel</button>
                                                    <button onClick={() => addLesson(mod.id)} disabled={saving} className="px-3 py-1.5 bg-hub-teal text-white rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-60">
                                                        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Add Lesson
                                                    </button>
                                                </div>
                                            </div>
                                        ) : null}

                                        {/* Add Lesson or Quiz Controls */}
                                        <div className="flex bg-accent/5">
                                            {showNewLesson !== mod.id && (
                                                <button onClick={() => setShowNewLesson(mod.id)} className="flex-1 py-3 text-xs font-bold text-hub-teal hover:bg-hub-teal/5 transition-all flex items-center justify-center gap-2 border-t border-r border-border/20">
                                                    <Plus className="w-3.5 h-3.5" /> Add Lesson
                                                </button>
                                            )}

                                            {showQuizEditor !== mod.id && (
                                                <button onClick={() => {
                                                    setShowQuizEditor(mod.id);
                                                    if (mod.quiz) {
                                                        const qs = mod.quiz.quiz_questions?.length ? mod.quiz.quiz_questions : [];
                                                        setEditingQuiz({
                                                            title: mod.quiz.title,
                                                            passing_score: mod.quiz.passing_score,
                                                            questions: qs.map((q: any) => ({
                                                                question_text: q.question_text,
                                                                points: q.points,
                                                                options: q.quiz_options?.length ? q.quiz_options : [{ option_text: "", is_correct: true }, { option_text: "", is_correct: false }]
                                                            }))
                                                        });
                                                    } else {
                                                        setEditingQuiz({
                                                            title: "Module Quiz",
                                                            passing_score: 80,
                                                            questions: [{ question_text: "", points: 10, options: [{ option_text: "", is_correct: true }, { option_text: "", is_correct: false }] }]
                                                        });
                                                    }
                                                }} className="flex-1 py-3 text-xs font-bold text-hub-rose hover:bg-hub-rose/5 transition-all flex items-center justify-center gap-2 border-t border-border/20">
                                                    <Gamepad2 className="w-3.5 h-3.5" /> {mod.quiz ? "Edit Quiz" : "Add Quiz"}
                                                </button>
                                            )}
                                        </div>

                                        {/* Quiz Editor UI */}
                                        {showQuizEditor === mod.id && (
                                            <div className="p-6 space-y-6 bg-hub-rose/5 border-t border-hub-rose/20">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-outfit font-bold text-hub-rose uppercase tracking-widest text-xs flex items-center gap-2">
                                                        <Gamepad2 className="w-4 h-4" /> Quiz Constructor
                                                    </h3>
                                                    <div className="flex gap-2 items-center">
                                                        <label className="text-xs font-bold text-muted-foreground uppercase">Passing Score %</label>
                                                        <input type="number" value={editingQuiz.passing_score} onChange={e => setEditingQuiz((p: any) => ({ ...p, passing_score: parseInt(e.target.value) || 0 }))} className="w-16 bg-accent/30 border border-border/50 px-2 py-1 rounded text-xs text-center" />
                                                    </div>
                                                </div>
                                                <input value={editingQuiz.title} onChange={e => setEditingQuiz((p: any) => ({ ...p, title: e.target.value }))} placeholder="Quiz Title" className="w-full bg-accent/30 border border-border/50 px-3 py-2 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-hub-rose/50" />

                                                <div className="space-y-6">
                                                    {editingQuiz.questions.map((q: any, qIdx: number) => (
                                                        <div key={qIdx} className="p-4 bg-background rounded-xl border border-border/50 space-y-4">
                                                            <div className="flex items-start gap-4">
                                                                <div className="w-8 h-8 rounded-full bg-hub-rose/10 text-hub-rose flex items-center justify-center font-bold text-xs shrink-0">{qIdx + 1}</div>
                                                                <div className="flex-1 space-y-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <input value={q.question_text} onChange={e => {
                                                                            const nq = [...editingQuiz.questions];
                                                                            nq[qIdx].question_text = e.target.value;
                                                                            setEditingQuiz({ ...editingQuiz, questions: nq });
                                                                        }} placeholder="Question text..." className="flex-1 bg-accent/30 border border-border/50 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-hub-rose/50" />
                                                                        <input type="number" value={q.points} onChange={e => {
                                                                            const nq = [...editingQuiz.questions];
                                                                            nq[qIdx].points = parseInt(e.target.value) || 0;
                                                                            setEditingQuiz({ ...editingQuiz, questions: nq });
                                                                        }} className="w-16 bg-accent/30 border border-border/50 px-2 py-2 rounded-lg text-sm text-center" title="Points" />
                                                                        <button onClick={() => {
                                                                            const nq = [...editingQuiz.questions];
                                                                            nq.splice(qIdx, 1);
                                                                            setEditingQuiz({ ...editingQuiz, questions: nq });
                                                                        }} className="p-2 hover:bg-hub-rose/10 rounded-lg text-hub-rose transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                                    </div>

                                                                    <div className="space-y-2 pl-4 border-l-2 border-border/50">
                                                                        {q.options.map((opt: any, oIdx: number) => (
                                                                            <div key={oIdx} className="flex items-center gap-2">
                                                                                <button onClick={() => {
                                                                                    const nq = [...editingQuiz.questions];
                                                                                    nq[qIdx].options.forEach((o: any) => o.is_correct = false);
                                                                                    nq[qIdx].options[oIdx].is_correct = true;
                                                                                    setEditingQuiz({ ...editingQuiz, questions: nq });
                                                                                }} className={cn("p-1 rounded-full border border-border transition-colors", opt.is_correct ? "bg-hub-rose border-hub-rose text-white" : "bg-accent/50 text-transparent")}>
                                                                                    <Check className="w-3 h-3" />
                                                                                </button>
                                                                                <input value={opt.option_text} onChange={e => {
                                                                                    const nq = [...editingQuiz.questions];
                                                                                    nq[qIdx].options[oIdx].option_text = e.target.value;
                                                                                    setEditingQuiz({ ...editingQuiz, questions: nq });
                                                                                }} placeholder={`Option ${oIdx + 1}...`} className="flex-1 bg-accent/30 border border-border/50 px-2 py-1.5 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-hub-rose/50" />
                                                                                {q.options.length > 2 && (
                                                                                    <button onClick={() => {
                                                                                        const nq = [...editingQuiz.questions];
                                                                                        nq[qIdx].options.splice(oIdx, 1);
                                                                                        setEditingQuiz({ ...editingQuiz, questions: nq });
                                                                                    }} className="p-1.5 text-muted-foreground hover:bg-accent rounded"><X className="w-3 h-3" /></button>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                        <button onClick={() => {
                                                                            const nq = [...editingQuiz.questions];
                                                                            nq[qIdx].options.push({ option_text: "", is_correct: false });
                                                                            setEditingQuiz({ ...editingQuiz, questions: nq });
                                                                        }} className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-hub-rose transition-colors flex items-center gap-1 mt-2">
                                                                            <Plus className="w-3 h-3" /> Add Option
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                <button onClick={() => {
                                                    setEditingQuiz((p: any) => ({
                                                        ...p,
                                                        questions: [...p.questions, { question_text: "", points: 10, options: [{ option_text: "", is_correct: true }, { option_text: "", is_correct: false }] }]
                                                    }));
                                                }} className="w-full py-3 border border-dashed border-border/50 rounded-xl text-xs font-bold text-muted-foreground hover:border-hub-rose/50 hover:text-hub-rose transition-all flex items-center justify-center gap-2">
                                                    <Plus className="w-4 h-4" /> Add Question
                                                </button>

                                                <div className="flex gap-2 pt-4">
                                                    <button onClick={() => setShowQuizEditor(null)} className="flex-1 py-2 bg-accent rounded-xl text-xs font-bold">Cancel</button>
                                                    <button onClick={() => saveQuiz(mod.id)} disabled={saving} className="flex-1 py-2 bg-hub-rose text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-60 shadow-xl shadow-hub-rose/20">
                                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Quiz
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}

                        {modules.length === 0 && !showNewModule && (
                            <div className="premium-card p-16 text-center border-dashed bg-accent/10 border-border flex flex-col items-center space-y-3">
                                <BookOpen className="w-10 h-10 text-muted-foreground opacity-20" />
                                <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">No modules yet</p>
                                <button onClick={() => setShowNewModule(true)} className="px-4 py-2 bg-hub-indigo text-white rounded-xl text-xs font-bold active:scale-95 transition-all">
                                    Add First Module
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Assignments */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-outfit font-bold flex items-center gap-2">
                            <ClipboardCheck className="w-5 h-5 text-hub-indigo" /> Assignments
                        </h2>
                        <button onClick={() => setShowNewAssignment(true)} className="p-2 bg-hub-indigo/10 hover:bg-hub-indigo/20 rounded-lg transition-all" title="Add Assignment">
                            <Plus className="w-4 h-4 text-hub-indigo" />
                        </button>
                    </div>

                    {/* New Assignment Form */}
                    {showNewAssignment && (
                        <div className="premium-card p-5 space-y-3 border-hub-indigo/30 bg-hub-indigo/5">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-hub-indigo">New Assignment</h3>
                            <input value={newAssignment.title} onChange={e => setNewAssignment(p => ({ ...p, title: e.target.value }))}
                                placeholder="Assignment title..." className="w-full bg-accent/30 border border-border/50 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-hub-indigo/50 transition-all" />
                            <textarea value={newAssignment.description} onChange={e => setNewAssignment(p => ({ ...p, description: e.target.value }))}
                                placeholder="Description..." rows={2} className="w-full bg-accent/30 border border-border/50 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-hub-indigo/50 resize-none transition-all" />
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Due Date</label>
                                    <input type="datetime-local" value={newAssignment.due_date} onChange={e => setNewAssignment(p => ({ ...p, due_date: e.target.value }))}
                                        className="w-full bg-accent/30 border border-border/50 px-2 py-1.5 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-hub-indigo/50 transition-all" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Max Score</label>
                                    <input type="number" value={newAssignment.max_score} onChange={e => setNewAssignment(p => ({ ...p, max_score: parseInt(e.target.value) || 100 }))}
                                        className="w-full bg-accent/30 border border-border/50 px-2 py-1.5 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-hub-indigo/50 transition-all" />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setShowNewAssignment(false)} className="flex-1 py-2 bg-accent rounded-lg text-xs font-bold">Cancel</button>
                                <button onClick={addAssignment} disabled={saving} className="flex-1 py-2 bg-hub-indigo text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-60">
                                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Create
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Assignment List */}
                    <div className="space-y-3">
                        {assignments.map(a => (
                            <div key={a.id} className="premium-card p-4 space-y-2 group hover:border-hub-indigo/30 transition-all">
                                <div className="flex items-start justify-between">
                                    {editingAssignmentId === a.id ? (
                                        <EditableField value={a.title} onSave={(val) => updateAssignment(a.id, { title: val })} onCancel={() => setEditingAssignmentId(null)} />
                                    ) : (
                                        <h4 className="text-sm font-bold font-outfit">{a.title}</h4>
                                    )}
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => setEditingAssignmentId(a.id)} className="p-1 hover:bg-accent rounded transition-colors"><Pencil className="w-3 h-3 text-muted-foreground" /></button>
                                        <button onClick={() => deleteAssignment(a.id)} className="p-1 hover:bg-hub-rose/10 rounded transition-colors"><Trash2 className="w-3 h-3 text-hub-rose" /></button>
                                    </div>
                                </div>
                                {a.description && <p className="text-xs text-muted-foreground line-clamp-2">{a.description}</p>}
                                <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                    {a.due_date && (
                                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(a.due_date).toLocaleDateString()}</span>
                                    )}
                                    <span>Max: {a.max_score}</span>
                                </div>
                            </div>
                        ))}
                        {assignments.length === 0 && !showNewAssignment && (
                            <div className="premium-card p-8 text-center border-dashed bg-accent/10 border-border">
                                <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">No assignments</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CourseBuilderPage() {
    return (
        <Suspense fallback={<div className="p-12 text-center animate-pulse text-muted-foreground uppercase tracking-widest text-xs">Loading Builder...</div>}>
            <CourseBuilderContent />
        </Suspense>
    );
}

// Inline editable field component
function EditableField({ value, onSave, onCancel }: { value: string; onSave: (val: string) => void; onCancel: () => void }) {
    const [val, setVal] = useState(value);
    return (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            <input value={val} onChange={e => setVal(e.target.value)} autoFocus
                className="bg-accent/30 border border-hub-indigo/30 px-2 py-1 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-hub-indigo/50 transition-all"
                onKeyDown={e => { if (e.key === 'Enter') onSave(val); if (e.key === 'Escape') onCancel(); }}
            />
            <button onClick={() => onSave(val)} className="p-1 bg-hub-teal/10 rounded hover:bg-hub-teal/20 transition-colors"><Check className="w-3.5 h-3.5 text-hub-teal" /></button>
            <button onClick={onCancel} className="p-1 bg-hub-rose/10 rounded hover:bg-hub-rose/20 transition-colors"><X className="w-3.5 h-3.5 text-hub-rose" /></button>
        </div>
    );
}
