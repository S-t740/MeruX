"use client";

import { useEffect, useMemo, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import TextAlign from "@tiptap/extension-text-align";
import { cn } from "@/lib/utils";

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

function ToolbarButton({
  active,
  onClick,
  label,
}: {
  active?: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-2 py-1 rounded-md border text-xs font-semibold transition-colors",
        active
          ? "bg-hub-indigo/15 border-hub-indigo/40 text-hub-indigo"
          : "bg-accent/30 border-border/60 text-foreground hover:bg-accent/60"
      )}
    >
      {label}
    </button>
  );
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const [textColor, setTextColor] = useState("#0f172a");
  const [highlightColor, setHighlightColor] = useState("#fef08a");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "tiptap-editor min-h-[160px] rounded-b-xl border border-t-0 border-border/50 bg-accent/10 px-3 py-3 text-sm focus:outline-none",
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [editor, value]);

  const toolbarClass = useMemo(
    () =>
      "flex flex-wrap items-center gap-1.5 rounded-t-xl border border-border/50 bg-accent/20 px-2 py-2",
    []
  );

  if (!editor) return null;

  return (
    <div className={cn("w-full", className)}>
      <div className={toolbarClass}>
        <ToolbarButton active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} label="B" />
        <ToolbarButton active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} label="I" />
        <ToolbarButton active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} label="U" />

        <ToolbarButton active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} label="H1" />
        <ToolbarButton active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} label="H2" />
        <ToolbarButton active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} label="H3" />

        <ToolbarButton active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} label="• List" />
        <ToolbarButton active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} label="1. List" />

        <ToolbarButton active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} label="Left" />
        <ToolbarButton active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} label="Center" />
        <ToolbarButton active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} label="Right" />

        <label className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-accent/30 px-2 py-1 text-[11px] font-semibold">
          Color
          <input
            type="color"
            value={textColor}
            onChange={(event) => {
              const color = event.target.value;
              setTextColor(color);
              editor.chain().focus().setColor(color).run();
            }}
            className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0"
          />
        </label>

        <label className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-accent/30 px-2 py-1 text-[11px] font-semibold">
          Highlight
          <input
            type="color"
            value={highlightColor}
            onChange={(event) => {
              const color = event.target.value;
              setHighlightColor(color);
              editor.chain().focus().setHighlight({ color }).run();
            }}
            className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0"
          />
        </label>

        <ToolbarButton
          active={editor.isActive("link")}
          onClick={() => {
            const existingHref = editor.getAttributes("link").href;
            const href = window.prompt("Enter URL", existingHref || "https://");
            if (href === null) return;
            if (!href) {
              editor.chain().focus().unsetLink().run();
              return;
            }
            editor.chain().focus().setLink({ href }).run();
          }}
          label="Link"
        />
        <ToolbarButton onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} label="Clear" />
      </div>

      {!value && placeholder ? (
        <div className="pointer-events-none absolute mt-12 ml-4 text-xs text-muted-foreground">{placeholder}</div>
      ) : null}

      <EditorContent editor={editor} />
    </div>
  );
}
