"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pin } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { fetcher, mutateJson } from "@/lib/fetcher";
import type { NoteItem } from "@/lib/types";
import { NoteEditor } from "@/components/notes/note-editor";

export default function NotesPage() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("<p>Start writing...</p>");
  const [tags, setTags] = useState("general");

  const { data = [] } = useQuery({
    queryKey: ["notes"],
    queryFn: () => fetcher<NoteItem[]>("/api/notes"),
  });

  const saveNote = useMutation({
    mutationFn: () => {
      const payload = {
        title,
        content,
        tags: tags
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      };

      if (selectedNoteId) {
        return mutateJson<NoteItem>(`/api/notes/${selectedNoteId}`, "PUT", payload);
      }

      return mutateJson<NoteItem>("/api/notes", "POST", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-stats"] });
      setSelectedNoteId(null);
      setTitle("");
      setContent("<p>Start writing...</p>");
      setTags("general");
      setShowEditor(false);
      toast.success("Note saved");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to save note");
    },
  });

  const updateNote = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<NoteItem> }) =>
      mutateJson<NoteItem>(`/api/notes/${id}`, "PUT", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  const filtered = useMemo(
    () =>
      data.filter((note) => {
        const q = query.toLowerCase();
        return note.title.toLowerCase().includes(q) || note.tags.some((tag) => tag.toLowerCase().includes(q));
      }),
    [data, query],
  );

  function openNewNote() {
    setSelectedNoteId(null);
    setTitle("");
    setContent("<p>Start writing...</p>");
    setTags("general");
    setShowEditor(true);
  }

  function openExistingNote(note: NoteItem) {
    setSelectedNoteId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setTags(note.tags.join(", "));
    setShowEditor(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-5xl font-semibold">Notes</h1>
          <p className="mt-2 text-xl text-text-secondary">
            {data.length} notes · {data.filter((item) => item.pinned).length} pinned
          </p>
        </div>
        <Button onClick={openNewNote}>
          <Plus className="size-4" /> New Note
        </Button>
      </div>

      <section className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
        <Input className="pl-9" placeholder="Search notes..." value={query} onChange={(event) => setQuery(event.target.value)} />
      </section>

      {showEditor && (
        <Card>
          <CardContent className="space-y-3">
            <p className="text-sm font-semibold text-text-secondary">
              {selectedNoteId ? "Editing note" : "Creating note"}
            </p>
            <Input placeholder="tags, separated, by commas" value={tags} onChange={(event) => setTags(event.target.value)} />
            <NoteEditor
              title={title}
              content={content}
              onTitleChange={setTitle}
              onContentChange={setContent}
              onSave={() => saveNote.mutate()}
              saving={saveNote.isPending}
            />
          </CardContent>
        </Card>
      )}

      {filtered.length ? (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((note) => (
            <Card key={note.id} className="cursor-pointer hover:shadow-lg" onClick={() => openExistingNote(note)}>
              <CardContent>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold">{note.title}</h3>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      updateNote.mutate({ id: note.id, payload: { pinned: !note.pinned } });
                    }}
                    className="rounded-lg p-2 hover:bg-divider"
                    aria-label="Toggle pin"
                  >
                    <Pin className={note.pinned ? "size-4 text-accent" : "size-4 text-text-muted"} />
                  </button>
                </div>
                <div className="mt-2 line-clamp-5 text-sm text-text-secondary" dangerouslySetInnerHTML={{ __html: note.content }} />
                <div className="mt-3 flex flex-wrap gap-2">
                  {note.tags.map((tag) => (
                    <Badge variant="muted" key={tag}>{tag}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      ) : (
        <Card>
          <CardContent className="grid h-44 place-items-center text-xl text-text-secondary">No notes yet. Create your first note!</CardContent>
        </Card>
      )}
    </div>
  );
}
