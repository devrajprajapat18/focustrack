"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function NoteEditor({
  title,
  content,
  tags,
  onTitleChange,
  onTagsChange,
  onContentChange,
  onSave,
  onCancel,
  saving,
}: {
  title: string;
  content: string;
  tags: string;
  onTitleChange: (value: string) => void;
  onTagsChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onSave: () => void;
  onCancel?: () => void;
  saving: boolean;
}) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-[300px] rounded-xl border border-border bg-surface px-3 py-2 text-text-primary focus:outline-none",
      },
    },
    onUpdate: ({ editor: current }) => {
      onContentChange(current.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    if (editor.getHTML() !== content) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  return (
    <div className="space-y-3">
      <Input value={title} onChange={(event) => onTitleChange(event.target.value)} placeholder="Note title" />
      <Input value={tags} onChange={(event) => onTagsChange(event.target.value)} placeholder="tags (comma separated): study, coding, revision" />

      <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-surface p-2">
        {[
          { icon: Bold, active: editor?.isActive("bold"), onClick: () => editor?.chain().focus().toggleBold().run(), label: "Bold" },
          { icon: Italic, active: editor?.isActive("italic"), onClick: () => editor?.chain().focus().toggleItalic().run(), label: "Italic" },
          { icon: Heading1, active: editor?.isActive("heading", { level: 1 }), onClick: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(), label: "Heading 1" },
          { icon: Heading2, active: editor?.isActive("heading", { level: 2 }), onClick: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(), label: "Heading 2" },
          { icon: List, active: editor?.isActive("bulletList"), onClick: () => editor?.chain().focus().toggleBulletList().run(), label: "Bullet List" },
          { icon: ListOrdered, active: editor?.isActive("orderedList"), onClick: () => editor?.chain().focus().toggleOrderedList().run(), label: "Numbered List" },
          { icon: Code, active: editor?.isActive("codeBlock"), onClick: () => editor?.chain().focus().toggleCodeBlock().run(), label: "Code Block" },
          { icon: Quote, active: editor?.isActive("blockquote"), onClick: () => editor?.chain().focus().toggleBlockquote().run(), label: "Quote" },
          { icon: Undo2, active: false, onClick: () => editor?.chain().focus().undo().run(), label: "Undo" },
          { icon: Redo2, active: false, onClick: () => editor?.chain().focus().redo().run(), label: "Redo" },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              type="button"
              className={cn(
                "grid size-8 place-items-center rounded-lg border border-border text-text-secondary transition-colors hover:bg-divider hover:text-text-primary",
                item.active && "bg-primary/10 text-primary",
              )}
              onClick={item.onClick}
              aria-label={item.label}
            >
              <Icon className="size-4" />
            </button>
          );
        })}
      </div>

      <EditorContent editor={editor} />
      <div className="flex items-center gap-2">
        <Button onClick={onSave} disabled={saving || !title.trim()}>
          {saving ? "Saving..." : "Save Note"}
        </Button>
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
