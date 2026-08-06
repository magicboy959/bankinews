"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

function ToolbarButton({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`rounded border px-2 py-1 text-sm font-semibold transition ${
        active ? "border-[#0A2342] bg-[#0A2342] text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

export function hasRichTextContent(value: string): boolean {
  const normalized = value.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
  return normalized.length > 0;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    immediatelyRender: false,
    content: value || "<p></p>",
    editorProps: {
      attributes: {
        class: "min-h-[220px] outline-none text-sm leading-7 text-slate-800",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    const nextValue = value || "<p></p>";
    const currentValue = editor.getHTML();

    if (nextValue !== currentValue) {
      editor.commands.setContent(nextValue, { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded border border-slate-300 bg-white">
      <div className="flex flex-wrap gap-1 border-b border-slate-200 bg-slate-50 p-2">
        <ToolbarButton active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold">
          B
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic">
          I
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strike">
          S
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading">
          H2
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list">
          • List
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Ordered list">
          1. List
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Quote">
          “Quote”
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Code block">
          &lt;/&gt;
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo">
          Undo
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo">
          Redo
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} className="min-h-[220px] px-3 py-3" />

      {placeholder && !value ? <p className="px-3 pb-3 text-sm text-slate-400">{placeholder}</p> : null}

      <style jsx global>{`
        .ProseMirror {
          min-height: 220px;
        }
        .ProseMirror p {
          margin: 0 0 0.75rem;
        }
        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.25rem;
          margin: 0 0 0.75rem;
        }
        .ProseMirror blockquote {
          border-left: 3px solid #cbd5e1;
          padding-left: 0.75rem;
          color: #475569;
          font-style: italic;
        }
        .ProseMirror pre {
          background: #0f172a;
          color: #e2e8f0;
          padding: 0.75rem;
          border-radius: 0.375rem;
          overflow-x: auto;
        }
      `}</style>
    </div>
  );
}
