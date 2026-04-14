"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NoteEditor({
  title,
  content,
  onTitleChange,
  onContentChange,
  onSave,
  saving,
}: {
  title: string;
  content: string;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-[220px] rounded-xl border border-border bg-surface px-3 py-2 text-text-primary focus:outline-none",
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
      editor.commands.setContent(content, false);
    }
  }, [content, editor]);

  return (
    <div className="space-y-3">
      <Input value={title} onChange={(event) => onTitleChange(event.target.value)} placeholder="Note title" />
      <EditorContent editor={editor} />
      <div className="flex items-center gap-2">
        <Button onClick={onSave} disabled={saving || !title.trim()}>
          {saving ? "Saving..." : "Save Note"}
        </Button>
      </div>
    </div>
  );
}
