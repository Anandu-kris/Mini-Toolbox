import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import type { NoteItem } from "@/services/notes.service";
import { useDebounceValue } from "@/hooks/useDebounceValue";
import {
  useCreateNote,
  useDeleteNote,
  useNotesList,
  useUpdateNote,
} from "@/hooks/useNotes";

import { NotesListPanel } from "@/components/Notes/NotesListPanel";
import { NotesEditorPanel } from "@/components/Notes/NotesEditorPanel";
import { OrbitLoader } from "../ui/Loader";

function sameTags(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

type NotesSectionProps = {
  trashed: boolean;
};

type NoteDraft = {
  title: string;
  contentHtml: string;
  tags: string[];
};

export function NotesSection({ trashed }: NotesSectionProps) {
  const isNotesOrTrash = true;

  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string>("");
  const [draftNoteId, setDraftNoteId] = useState<string>("");
  const [tagInput, setTagInput] = useState("");

  const [draft, setDraft] = useState<NoteDraft>({
    title: "",
    contentHtml: "",
    tags: [],
  });

  const [saveState, setSaveState] = useState<
    "idle" | "dirty" | "saving" | "saved"
  >("idle");

  const [baseline, setBaseline] = useState<NoteDraft>({
    title: "",
    contentHtml: "",
    tags: [],
  });

  const listParams = useMemo(
    () => ({
      limit: 200,
      q: q.trim() ? q.trim() : undefined,
      trashed,
    }),
    [q, trashed],
  );

  const {
    data: notes = [],
    isLoading,
    isError,
    error,
  } = useNotesList(listParams, isNotesOrTrash);

  const createMut = useCreateNote();
  const updateMut = useUpdateNote();
  const deleteMut = useDeleteNote();

  useEffect(() => {
    if (!notes.length) {
      setSelectedId("");
      setDraftNoteId("");
      return;
    }

    if (selectedId && !notes.some((n) => n.id === selectedId)) {
      setSelectedId("");
      setDraftNoteId("");
    }
  }, [notes, selectedId]);

  const selected: NoteItem | null =
    notes.find((n) => n.id === selectedId) ?? null;

  function draftFromNote(note: NoteItem): NoteDraft {
    return {
      title: note.title ?? "",
      contentHtml: note.contentHtml ?? "",
      tags: note.tags ?? [],
    };
  }

  function sameDraftToBaseline(d: NoteDraft, b: NoteDraft) {
    return (
      d.title === b.title &&
      d.contentHtml === b.contentHtml &&
      sameTags(d.tags, b.tags)
    );
  }

  const baselineRef = useRef(baseline);

  useEffect(() => {
    baselineRef.current = baseline;
  }, [baseline]);

  const normalizeHtml = (html: string) => html.replace(/\s+/g, " ").trim();

  // Load draft when selected note changes, but only if draft is not already prepared for it
  useEffect(() => {
    if (!selected) {
      setDraftNoteId("");
      return;
    }

    if (draftNoteId === selected.id) return;

    const next = draftFromNote(selected);
    setDraft(next);
    setBaseline(next);
    setSaveState("idle");
    setTagInput("");
    setDraftNoteId(selected.id);
  }, [selected, draftNoteId]);

  // Dirty state only for the correct note-draft pair
  useEffect(() => {
    if (!selected || trashed) return;
    if (draftNoteId !== selected.id) return;

    const base = baselineRef.current;
    const isSame = sameDraftToBaseline(draft, base);

    if (!isSame) {
      if (saveState !== "saving") setSaveState("dirty");
    } else {
      if (saveState === "dirty") setSaveState("idle");
    }
  }, [draft, selected, draftNoteId, trashed, saveState]);

  const debouncedDraft = useDebounceValue(
    { noteId: draftNoteId, ...draft },
    800,
  );

  // Autosave only when draft actually belongs to current selected note
  useEffect(() => {
    if (!selected || trashed) return;
    if (!debouncedDraft.noteId) return;
    if (debouncedDraft.noteId !== selected.id) return;
    if (draftNoteId !== selected.id) return;

    const base = baselineRef.current;

    const normalized = {
      title: debouncedDraft.title.trim(),
      contentHtml: normalizeHtml(debouncedDraft.contentHtml),
      tags: debouncedDraft.tags,
    };

    if (!normalized.title) return;

    if (
      normalized.title === base.title &&
      normalized.contentHtml === normalizeHtml(base.contentHtml) &&
      sameTags(normalized.tags, base.tags)
    ) {
      return;
    }

    if (updateMut.isPending) return;

    setSaveState("saving");

    updateMut.mutate(
      {
        noteId: selected.id,
        payload: {
          title: normalized.title,
          contentHtml: normalized.contentHtml,
          tags: normalized.tags,
        },
      },
      {
        onSuccess: () => {
          setBaseline({
            title: normalized.title,
            contentHtml: debouncedDraft.contentHtml,
            tags: normalized.tags,
          });
          setSaveState("saved");
          setTimeout(() => setSaveState("idle"), 800);
        },
        onError: (e: unknown) => {
          const err = e as { response?: { data?: { detail?: string } } };
          toast.error(err?.response?.data?.detail ?? "Autosave failed");
          setSaveState("dirty");
        },
      },
    );
  }, [debouncedDraft, selected, draftNoteId, trashed, updateMut]);

  const createNote = () => {
    createMut.mutate(
      { title: "Untitled", contentHtml: "", tags: [], pinned: false },
      {
        onSuccess: (created) => {
          toast.success("Note created");
          setQ("");

          const next: NoteDraft = {
            title: created.title ?? "",
            contentHtml: created.contentHtml ?? "",
            tags: created.tags ?? [],
          };

          setDraft(next);
          setBaseline(next);
          setSaveState("idle");
          setTagInput("");
          setDraftNoteId(created.id);
          setSelectedId(created.id);
        },
        onError: (e: unknown) => {
          const err = e as { response?: { data?: { detail?: string } } };
          toast.error(err?.response?.data?.detail ?? "Create failed");
        },
      },
    );
  };

  const openNote = (id: string) => {
    const note = notes.find((n) => n.id === id);

    if (!note) {
      setSelectedId(id);
      return;
    }

    const next = draftFromNote(note);

    setDraft(next);
    setBaseline(next);
    setSaveState("idle");
    setTagInput("");
    setDraftNoteId(id);
    setSelectedId(id);
  };

  const closeEditor = () => {
    setSelectedId("");
    setDraftNoteId("");
  };

  const moveToTrash = () => {
    if (!selected) return;

    updateMut.mutate(
      { noteId: selected.id, payload: { isTrashed: true } },
      {
        onSuccess: () => {
          toast.success("Moved to Trash");
          setSelectedId("");
          setDraftNoteId("");
        },
        onError: (e: unknown) => {
          const err = e as { response?: { data?: { detail?: string } } };
          toast.error(err?.response?.data?.detail ?? "Failed to move");
        },
      },
    );
  };

  const restore = () => {
    if (!selected) return;

    updateMut.mutate(
      { noteId: selected.id, payload: { isTrashed: false } },
      {
        onSuccess: () => {
          toast.success("Restored");
          setSelectedId("");
          setDraftNoteId("");
        },
        onError: (e: unknown) => {
          const err = e as { response?: { data?: { detail?: string } } };
          toast.error(err?.response?.data?.detail ?? "Failed to restore");
        },
      },
    );
  };

  const deleteForever = () => {
    if (!selected) return;

    deleteMut.mutate(selected.id, {
      onSuccess: () => {
        toast.success("Deleted forever");
        setSelectedId("");
        setDraftNoteId("");
      },
      onError: (e: unknown) => {
        const err = e as { response?: { data?: { detail?: string } } };
        toast.error(err?.response?.data?.detail ?? "Delete failed");
      },
    });
  };

  const addTag = () => {
    if (!selected) return;
    if (trashed) return;
    if (draftNoteId !== selected.id) return;

    const t = tagInput.trim().replace(/^#/, "");
    if (!t) return;

    setDraft((d) => {
      if (d.tags.includes(t)) return d;
      return { ...d, tags: [...d.tags, t] };
    });

    setTagInput("");
  };

  const removeTag = (t: string) => {
    if (trashed) return;
    if (!selected) return;
    if (draftNoteId !== selected.id) return;

    setDraft((d) => ({ ...d, tags: d.tags.filter((x) => x !== t) }));
  };

  const isDraftReady = !!selected && draftNoteId === selected.id;

  return selected ? (
    isDraftReady ? (
      <NotesEditorPanel
        key={selected.id}
        isNotesOrTrash={isNotesOrTrash}
        trashed={trashed}
        selected={selected}
        draft={draft}
        onDraftChange={setDraft}
        tagInput={tagInput}
        onTagInputChange={setTagInput}
        saveState={saveState}
        onMoveToTrash={moveToTrash}
        onRestore={restore}
        onDeleteForever={deleteForever}
        onAddTag={addTag}
        onRemoveTag={removeTag}
        updatePending={updateMut.isPending}
        deletePending={deleteMut.isPending}
        onBack={closeEditor}
      />
    ) : (
      <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 h-full min-h-0 flex items-center justify-center text-white/60">
        <OrbitLoader />
      </section>
    )
  ) : (
    <NotesListPanel
      q={q}
      onQChange={setQ}
      trashed={trashed}
      isNotesOrTrash={isNotesOrTrash}
      notes={notes}
      selectedId={selectedId}
      onSelect={openNote}
      isLoading={isLoading}
      isError={isError}
      error={error}
      onCreate={createNote}
      createPending={createMut.isPending}
    />
  );
}