'use client';

import { LessonJSON } from '@/types/lesson-json';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, BookOpen, Loader2, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdoptToCourseModalProps {
    lessonJSON: LessonJSON;
    onClose: () => void;
}

export function AdoptToCourseModal({ lessonJSON, onClose }: AdoptToCourseModalProps) {
    const supabase = createClient();
    const [courses, setCourses] = useState<any[]>([]);
    const [modules, setModules] = useState<any[]>([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [selectedModule, setSelectedModule] = useState('');
    const [lessonName, setLessonName] = useState(lessonJSON.metadata.lesson || 'New Lesson');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    // Fetch instructor's courses
    useEffect(() => {
        async function fetchCourses() {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('courses')
                    .select('id, title')
                    .order('created_at', { ascending: false });
                if (error) throw error;
                setCourses(data || []);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchCourses();
    }, []);

    // Fetch modules when course changes
    useEffect(() => {
        if (!selectedCourse) return;
        setSelectedModule('');
        setModules([]);
        async function fetchModules() {
            const { data, error } = await supabase
                .from('modules')
                .select('id, title, order_index')
                .eq('course_id', selectedCourse)
                .order('order_index');
            if (!error) setModules(data || []);
        }
        fetchModules();
    }, [selectedCourse]);

    const handleAdopt = async () => {
        if (!selectedCourse || !selectedModule || !lessonName.trim()) {
            setError('Please fill in all fields before adopting.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            // Get current lesson count for order_index
            const { count } = await supabase
                .from('lessons')
                .select('*', { count: 'exact', head: true })
                .eq('module_id', selectedModule);

            const { error: insertError } = await supabase.from('lessons').insert({
                module_id: selectedModule,
                title: lessonName.trim(),
                content: JSON.stringify(lessonJSON),
                order_index: count || 0,
            });

            if (insertError) throw insertError;
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Failed to adopt lesson.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div
                className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl shadow-black/20 overflow-hidden animate-slide-up"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border/50">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-hub-indigo/10 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-hub-indigo" />
                        </div>
                        <div>
                            <p className="font-bold font-outfit text-sm">Adopt to Course</p>
                            <p className="text-xs text-muted-foreground">Save this lesson into your LMS</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-accent transition-colors">
                        <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                </div>

                {success ? (
                    <div className="p-8 flex flex-col items-center gap-4 text-center">
                        <div className="w-14 h-14 rounded-full bg-hub-teal/10 flex items-center justify-center">
                            <Check className="w-7 h-7 text-hub-teal" />
                        </div>
                        <div>
                            <p className="font-bold font-outfit text-lg">Lesson Adopted!</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                <strong>{lessonName}</strong> has been added to your course. You can now view and edit it in the Course Builder.
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 bg-hub-teal text-white rounded-xl font-bold text-sm hover:bg-hub-teal/90 transition-all"
                        >
                            Done
                        </button>
                    </div>
                ) : (
                    <div className="p-6 space-y-4">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-hub-indigo" />
                            </div>
                        ) : (
                            <>
                                {/* Lesson Title */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Lesson Title</label>
                                    <input
                                        value={lessonName}
                                        onChange={e => setLessonName(e.target.value)}
                                        className="w-full bg-accent/30 border border-border/50 px-3 py-2.5 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-hub-indigo/30 transition-all"
                                        placeholder="Enter lesson title..."
                                    />
                                </div>

                                {/* Course Selector */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Course</label>
                                    <div className="relative">
                                        <select
                                            value={selectedCourse}
                                            onChange={e => setSelectedCourse(e.target.value)}
                                            className="w-full appearance-none bg-accent/30 border border-border/50 px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-hub-indigo/30 transition-all pr-10"
                                        >
                                            <option value="">Select a course...</option>
                                            {courses.map(c => (
                                                <option key={c.id} value={c.id}>{c.title}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                    </div>
                                </div>

                                {/* Module Selector */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Module</label>
                                    <div className="relative">
                                        <select
                                            value={selectedModule}
                                            onChange={e => setSelectedModule(e.target.value)}
                                            disabled={!selectedCourse || modules.length === 0}
                                            className={cn(
                                                'w-full appearance-none bg-accent/30 border border-border/50 px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-hub-indigo/30 transition-all pr-10',
                                                !selectedCourse ? 'opacity-50 cursor-not-allowed' : ''
                                            )}
                                        >
                                            <option value="">
                                                {!selectedCourse ? 'Select a course first...' : modules.length === 0 ? 'No modules found' : 'Select a module...'}
                                            </option>
                                            {modules.map(m => (
                                                <option key={m.id} value={m.id}>{m.title}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                    </div>
                                </div>

                                {/* JSON preview info */}
                                <div className="rounded-lg bg-accent/30 border border-border/30 px-3 py-2 text-xs text-muted-foreground">
                                    📦 This lesson contains <strong>{lessonJSON.blocks.length} blocks</strong> and will be stored as structured JSON in the lesson content field.
                                </div>

                                {/* Error */}
                                {error && (
                                    <p className="text-xs text-hub-rose font-medium bg-hub-rose/5 border border-hub-rose/20 rounded-lg px-3 py-2">
                                        {error}
                                    </p>
                                )}

                                {/* Actions */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={onClose}
                                        className="flex-1 py-2.5 bg-accent rounded-xl text-sm font-bold hover:bg-accent/80 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAdopt}
                                        disabled={saving || !selectedCourse || !selectedModule || !lessonName.trim()}
                                        className="flex-1 py-2.5 bg-hub-indigo text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-hub-indigo/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-hub-indigo/20"
                                    >
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
                                        {saving ? 'Saving...' : 'Adopt Lesson'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
