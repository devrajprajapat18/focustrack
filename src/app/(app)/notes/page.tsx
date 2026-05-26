"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  CalendarClock,
  Copy,
  FolderKanban,
  LayoutGrid,
  List,
  Pencil,
  Pin,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { fetcher, mutateJson } from "@/lib/fetcher";
import type { NoteItem } from "@/lib/types";
import { NoteEditor } from "@/components/notes/note-editor";
import { cn } from "@/lib/utils";

const COLLECTIONS = ["All", "Study", "Coding", "Personal", "Uncategorized"] as const;

type SortBy = "updated-desc" | "created-desc" | "title-asc";

function normalizeTag(tag: string) {
  return tag.trim().replace(/^#/, "").toLowerCase();
}

function toTitleCase(value: string) {
  if (!value) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function highlightText(value: string, query: string) {
  if (!query.trim()) {
    return value;
  }

  const lower = value.toLowerCase();
  const q = query.toLowerCase();
  const index = lower.indexOf(q);
  if (index < 0) {
    return value;
  }

  const before = value.slice(0, index);
  const match = value.slice(index, index + q.length);
  const after = value.slice(index + q.length);

  return (
    <>
      {before}
      <mark className="rounded bg-primary/20 px-0.5 text-text-primary">{match}</mark>
      {after}
    </>
  );
}

function getNoteCollection(note: NoteItem) {
  const tags = note.tags.map((tag) => normalizeTag(tag));
  if (tags.includes("study")) return "Study";
  if (tags.includes("coding")) return "Coding";
  if (tags.includes("personal")) return "Personal";
  return "Uncategorized";
}

export default function NotesPage() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [collection, setCollection] = useState<(typeof COLLECTIONS)[number]>("All");
  const [sortBy, setSortBy] = useState<SortBy>("updated-desc");
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");

  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState<"view" | "edit" | "new">("view");
  const [selectedNote, setSelectedNote] = useState<NoteItem | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("<p>Start writing...</p>");
  const [tags, setTags] = useState("study");

  const { data = [] } = useQuery({
    queryKey: ["notes"],
    queryFn: () => fetcher<NoteItem[]>("/api/notes"),
  });

  const saveNote = useMutation({
    mutationFn: () => {
      const normalizedTags = tags
        .split(",")
        .map((item) => normalizeTag(item))
        .filter(Boolean);

      const payload = {
        title,
        content,
        tags: Array.from(new Set(normalizedTags)).map((tag) => toTitleCase(tag)),
      };

      if (selectedNote) {
        return mutateJson<NoteItem>(`/api/notes/${selectedNote.id}`, "PUT", payload);
      }

      return mutateJson<NoteItem>("/api/notes", "POST", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-stats"] });
      setSelectedNote(null);
      setTitle("");
      setContent("<p>Start writing...</p>");
      setTags("study");
      setShowModal(false);
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
      queryClient.invalidateQueries({ queryKey: ["analytics-stats"] });
    },
  });

  const deleteNote = useMutation({
    mutationFn: (id: string) => mutateJson<{ ok: true }>(`/api/notes/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-stats"] });
      setShowModal(false);
      toast.success("Note deleted");
    },
  });

  const duplicateNote = useMutation({
    mutationFn: (note: NoteItem) =>
      mutateJson<NoteItem>("/api/notes", "POST", {
        title: `${note.title} (Copy)`,
        content: note.content,
        tags: note.tags,
        pinned: false,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-stats"] });
      toast.success("Note duplicated");
    },
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return data
      .filter((note) => {
        const isArchived = note.tags.map((tag) => normalizeTag(tag)).includes("archived");
        return showArchived || !isArchived;
      })
      .filter((note) => {
        if (collection === "All") {
          return true;
        }
        return getNoteCollection(note) === collection;
      })
      .filter((note) => {
        if (!showPinnedOnly) {
          return true;
        }
        return note.pinned;
      })
      .filter((note) => {
        if (!q) {
          return true;
        }

        const text = `${note.title} ${stripHtml(note.content)} ${note.tags.join(" ")}`.toLowerCase();
        return text.includes(q);
      })
      .sort((a, b) => {
        if (sortBy === "updated-desc") {
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        }
        if (sortBy === "created-desc") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return a.title.localeCompare(b.title);
      });
  }, [collection, data, query, showArchived, showPinnedOnly, sortBy]);

  const pinnedNotes = filtered.filter((note) => note.pinned);
  const regularNotes = filtered.filter((note) => !note.pinned);

  function openNewNote() {
    setMode("new");
    setSelectedNote(null);
    setTitle("");
    setContent("<p>Start writing...</p>");
    setTags("study");
    setShowModal(true);
  }

  function openExistingNote(note: NoteItem) {
    setMode("view");
    setSelectedNote(note);
    setTitle(note.title);
    setContent(note.content);
    setTags(note.tags.join(", "));
    setShowModal(true);
  }

  function startEditingSelected() {
    if (!selectedNote) {
      return;
    }
    setMode("edit");
  }

  function setDraftFromNote(note: NoteItem) {
    setSelectedNote(note);
    setTitle(note.title);
    setContent(note.content);
    setTags(note.tags.join(", "));
  }

  function toggleArchive(note: NoteItem) {
    const normalized = note.tags.map((tag) => normalizeTag(tag));
    const hasArchived = normalized.includes("archived");
    const nextTags = hasArchived
      ? note.tags.filter((tag) => normalizeTag(tag) !== "archived")
      : [...note.tags, "Archived"];

    updateNote.mutate({ id: note.id, payload: { tags: nextTags } });
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
        <Button onClick={openNewNote} className="shadow-sm transition-transform hover:-translate-y-0.5">
          <Plus className="size-4" /> New Note
        </Button>
      </div>

      <Card className="border-border/70 bg-[linear-gradient(160deg,color-mix(in_oklab,var(--primary)_10%,var(--surface))_0%,var(--surface)_100%)]">
        <CardContent className="space-y-4">
          <section className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
            <Input className="pl-9" placeholder="Search title, tags, or content..." value={query} onChange={(event) => setQuery(event.target.value)} />
          </section>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary"><FolderKanban className="size-4" /> Collections</span>
            {COLLECTIONS.map((item) => (
              <Button key={item} type="button" size="sm" variant={collection === item ? "default" : "outline"} onClick={() => setCollection(item)}>
                {item}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" variant={showPinnedOnly ? "secondary" : "outline"} onClick={() => setShowPinnedOnly((prev) => !prev)}>
              <Pin className="size-4" /> Pinned Only
            </Button>
            <Button type="button" size="sm" variant={showArchived ? "secondary" : "outline"} onClick={() => setShowArchived((prev) => !prev)}>
              <Archive className="size-4" /> Show Archived
            </Button>

            <div className="ml-auto flex items-center gap-2">
              <select
                className="h-9 rounded-lg border border-border bg-surface px-2 text-sm"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as SortBy)}
              >
                <option value="updated-desc">Recently Edited</option>
                <option value="created-desc">Newest Created</option>
                <option value="title-asc">Title A-Z</option>
              </select>

              <div className="inline-flex rounded-lg border border-border bg-surface p-1">
                <Button type="button" size="sm" variant={view === "grid" ? "default" : "ghost"} onClick={() => setView("grid")}>
                  <LayoutGrid className="size-4" />
                </Button>
                <Button type="button" size="sm" variant={view === "list" ? "default" : "ghost"} onClick={() => setView("list")}>
                  <List className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {pinnedNotes.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-text-primary">📌 Pinned Notes</h2>
          <div className={cn("grid gap-4", view === "grid" ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1") }>
            {pinnedNotes.map((note) => (
              <Card key={note.id} className="cursor-pointer border-border/70 bg-[linear-gradient(165deg,color-mix(in_oklab,var(--accent)_12%,var(--surface))_0%,var(--surface)_100%)] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md" onClick={() => openExistingNote(note)}>
                <CardContent className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold text-text-primary">{highlightText(note.title, query)}</h3>
                    <Pin className="size-4 text-accent" />
                  </div>
                  <p className="line-clamp-4 text-sm text-text-secondary">{highlightText(stripHtml(note.content), query)}</p>
                  <div className="flex flex-wrap gap-2">
                    {note.tags.map((tag) => (
                      <Badge variant="muted" key={tag}>#{highlightText(tag, query)}</Badge>
                    ))}
                  </div>
                  <p className="text-xs text-text-muted">Updated {format(new Date(note.updatedAt), "MMM d, yyyy · HH:mm")}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {filtered.length ? (
        <section className={cn("grid gap-4", view === "grid" ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1") }>
          {regularNotes.map((note) => (
            <Card key={note.id} className="group cursor-pointer border-border/70 bg-[linear-gradient(160deg,color-mix(in_oklab,var(--primary)_6%,var(--surface))_0%,var(--surface)_100%)] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md" onClick={() => openExistingNote(note)}>
              <CardContent className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">{highlightText(note.title, query)}</h3>
                    <p className="mt-1 text-xs text-text-muted">{getNoteCollection(note)}</p>
                  </div>
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

                <p className={cn("text-sm text-text-secondary", view === "grid" ? "line-clamp-5" : "line-clamp-2")}>{highlightText(stripHtml(note.content), query)}</p>

                <div className="flex flex-wrap gap-2">
                  {note.tags.map((tag) => (
                    <Badge variant="muted" key={tag}>#{highlightText(tag, query)}</Badge>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-text-muted">
                  <span className="inline-flex items-center gap-1"><CalendarClock className="size-3.5" /> Created {format(new Date(note.createdAt), "MMM d, yyyy")}</span>
                  <span>Edited {format(new Date(note.updatedAt), "MMM d, HH:mm")}</span>
                </div>

                <div className="flex flex-wrap gap-2 opacity-80 transition-opacity group-hover:opacity-100">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={(event) => {
                      event.stopPropagation();
                      setDraftFromNote(note);
                      setMode("edit");
                      setShowModal(true);
                    }}
                  >
                    <Pencil className="size-4" /> Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={(event) => {
                      event.stopPropagation();
                      duplicateNote.mutate(note);
                    }}
                  >
                    <Copy className="size-4" /> Duplicate
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleArchive(note);
                    }}
                  >
                    <Archive className="size-4" /> Archive
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      ) : (
        <Card className="border-dashed border-border/80 bg-divider/60">
          <CardContent className="grid h-56 place-items-center text-center">
            <div>
              <p className="text-3xl">✍️</p>
              <p className="mt-2 text-xl font-semibold text-text-primary">Start writing your first note</p>
              <p className="mt-1 text-sm text-text-secondary">Capture ideas, tag them, and organize them into collections.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <Card className="max-h-[90vh] w-full max-w-4xl overflow-y-auto border-border/80 shadow-xl">
            <CardHeader className="sticky top-0 z-10 border-b border-border bg-surface/95 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <CardTitle>
                  {mode === "new" ? "Create Note" : mode === "edit" ? "Edit Note" : "Note Details"}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {selectedNote && mode === "view" && (
                    <>
                      <Button type="button" size="sm" variant="outline" onClick={startEditingSelected}>
                        <Pencil className="size-4" /> Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => duplicateNote.mutate(selectedNote)}
                      >
                        <Copy className="size-4" /> Duplicate
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => toggleArchive(selectedNote)}
                      >
                        <Archive className="size-4" /> Archive
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        onClick={() => deleteNote.mutate(selectedNote.id)}
                      >
                        <Trash2 className="size-4" /> Delete
                      </Button>
                    </>
                  )}
                  <Button type="button" size="icon" variant="ghost" onClick={() => setShowModal(false)} aria-label="Close">
                    <X className="size-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 p-5">
              {mode === "view" && selectedNote ? (
                <>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-semibold text-text-primary">{selectedNote.title}</h2>
                    <div className="flex flex-wrap gap-2">
                      {selectedNote.tags.map((tag) => (
                        <Badge variant="muted" key={tag}>#{tag}</Badge>
                      ))}
                    </div>
                    <p className="text-xs text-text-muted">
                      Created {format(new Date(selectedNote.createdAt), "MMM d, yyyy · HH:mm")} · Last edited {format(new Date(selectedNote.updatedAt), "MMM d, yyyy · HH:mm")}
                    </p>
                  </div>

                  <article className="prose prose-sm max-w-none rounded-xl border border-border bg-surface p-4 text-text-primary" dangerouslySetInnerHTML={{ __html: selectedNote.content }} />
                </>
              ) : (
                <NoteEditor
                  title={title}
                  content={content}
                  tags={tags}
                  onTitleChange={setTitle}
                  onTagsChange={setTags}
                  onContentChange={setContent}
                  onSave={() => saveNote.mutate()}
                  onCancel={() => {
                    if (selectedNote) {
                      setMode("view");
                    } else {
                      setShowModal(false);
                    }
                  }}
                  saving={saveNote.isPending}
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
