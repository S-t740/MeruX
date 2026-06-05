'use client';

import { LessonJSON, LessonBlock, BlockType } from '@/types/lesson-json';
import { HeadingBlock } from './blocks/HeadingBlock';
import { SubheadingBlock } from './blocks/SubheadingBlock';
import { ParagraphBlock } from './blocks/ParagraphBlock';
import { CalloutBlock } from './blocks/CalloutBlock';
import { TableBlock } from './blocks/TableBlock';
import { ImagePromptBlock } from './blocks/ImagePromptBlock';
import { FlashcardsBlock } from './blocks/FlashcardsBlock';
import { QuizBlock } from './blocks/QuizBlock';
import { FillBlankBlock } from './blocks/FillBlankBlock';
import { LabBlock } from './blocks/LabBlock';
import { ExamQuestionsBlock } from './blocks/ExamQuestionsBlock';
import { GlossaryBlock } from './blocks/GlossaryBlock';
import { RecapBlock } from './blocks/RecapBlock';
import { NextLessonBlock } from './blocks/NextLessonBlock';
import { InstructorNoteBlock } from './blocks/InstructorNoteBlock';
import { ChecklistBlock } from './blocks/ChecklistBlock';

function renderBlock(block: LessonBlock) {
    const { type, data } = block;
    switch (type as BlockType) {
        case 'heading':        return <HeadingBlock data={data as any} />;
        case 'subheading':     return <SubheadingBlock data={data as any} />;
        case 'paragraph':      return <ParagraphBlock data={data as any} />;
        case 'callout':        return <CalloutBlock data={data as any} />;
        case 'table':          return <TableBlock data={data as any} />;
        case 'image_prompt':   return <ImagePromptBlock data={data as any} />;
        case 'flashcards':     return <FlashcardsBlock data={data as any} />;
        case 'quiz':           return <QuizBlock data={data as any} />;
        case 'fill_blank':     return <FillBlankBlock data={data as any} />;
        case 'lab':            return <LabBlock data={data as any} />;
        case 'exam_questions': return <ExamQuestionsBlock data={data as any} />;
        case 'glossary':       return <GlossaryBlock data={data as any} />;
        case 'recap':          return <RecapBlock data={data as any} />;
        case 'next_lesson':    return <NextLessonBlock data={data as any} />;
        case 'instructor_note':return <InstructorNoteBlock data={data as any} />;
        case 'checklist':      return <ChecklistBlock data={data as any} />;
        default:
            return (
                <div className="px-4 py-3 rounded-lg border border-dashed border-border bg-accent/20 text-xs text-muted-foreground font-mono">
                    Unknown block type: {type}
                </div>
            );
    }
}

export function LessonRenderer({ lesson }: { lesson: LessonJSON }) {
    return (
        <div className="space-y-5">
            {/* Metadata strip */}
            <div className="flex flex-wrap gap-2 pb-2 border-b border-border/30">
                {[
                    { label: lesson.metadata.difficulty, color: 'bg-hub-amber/10 text-hub-amber border-hub-amber/20' },
                    { label: `${lesson.metadata.estimated_time_minutes} min`, color: 'bg-hub-indigo/10 text-hub-indigo border-hub-indigo/20' },
                    ...lesson.metadata.tags.slice(0, 4).map(t => ({ label: t, color: 'bg-accent text-muted-foreground border-border/50' }))
                ].map((badge, i) => (
                    <span key={i} className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide ${badge.color}`}>
                        {badge.label}
                    </span>
                ))}
            </div>

            {/* Blocks */}
            {lesson.blocks.map((block) => (
                <div key={block.id} id={block.id}>
                    {renderBlock(block)}
                </div>
            ))}
        </div>
    );
}
