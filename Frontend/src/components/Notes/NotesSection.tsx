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

function sameTags(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

type NotesSectionProps = {
  trashed: boolean;
};

export function NotesSection({ trashed }: NotesSectionProps) {
  const isNotesOrTrash = true;

  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string>("");
  const [tagInput, setTagInput] = useState("");

  const [draft, setDraft] = useState<{
    title: string;
    contentHtml: string;
    tags: string[];
  }>({
    title: "",
    contentHtml: "",
    tags: [],
  });

  const [saveState, setSaveState] = useState<
    "idle" | "dirty" | "saving" | "saved"
  >("idle");

  const [baseline, setBaseline] = useState<{
    title: string;
    contentHtml: string;
    tags: string[];
  }>({
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

  // Auto-select first note
  useEffect(() => {
    if (!notes.length) {
      setSelectedId("");
      return;
    }
    if (!selectedId || !notes.some((n) => n.id === selectedId)) {
      setSelectedId(notes[0].id);
    }
  }, [notes, selectedId]);

  const selected: NoteItem | null =
    notes.find((n) => n.id === selectedId) ?? null;

  // When selection changes, load draft
  useEffect(() => {
    if (!selected) return;

    const next = {
      title: selected.title ?? "",
      contentHtml: selected.contentHtml ?? "",
      tags: selected.tags ?? [],
    };

    setDraft(next);
    setBaseline(next);
    setSaveState("idle");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  function sameDraftToBaseline(
    draft: { title: string; contentHtml: string; tags: string[] },
    baseline: { title: string; contentHtml: string; tags: string[] },
  ) {
    return (
      draft.title === baseline.title &&
      draft.contentHtml === baseline.contentHtml &&
      sameTags(draft.tags, baseline.tags)
    );
  }

  const baselineRef = useRef(baseline);
  useEffect(() => {
    baselineRef.current = baseline;
  }, [baseline]);
  const normalizeHtml = (html: string) => html.replace(/\s+/g, " ").trim();

  // Mark dirty when draft changes
  useEffect(() => {
    if (!selected || trashed) return;
    const base = baselineRef.current;

    const isSame = sameDraftToBaseline(draft, base);

    if (!isSame) {
      if (saveState !== "saving") setSaveState("dirty");
    } else {
      if (saveState === "dirty") setSaveState("idle");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, selected?.id, trashed, saveState]);

  const debouncedDraft = useDebounceValue(
    { noteId: selectedId, ...draft },
    800,
  );

  // Autosave
  useEffect(() => {
    if (!selected || trashed) return;
    if (!debouncedDraft.noteId) return;
    if (debouncedDraft.noteId !== selected.id) return;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedDraft, selected?.id, trashed]);

  const createNote = () => {
    createMut.mutate(
      { title: "Untitled", contentHtml: "", tags: [], pinned: false },
      {
        onSuccess: (created) => {
          toast.success("Note created");
          setQ("");
          setSelectedId(created.id);
        },
        onError: (e: unknown) => {
          const err = e as { response?: { data?: { detail?: string } } };
          toast.error(err?.response?.data?.detail ?? "Create failed");
        },
      },
    );
  };

  const moveToTrash = () => {
    if (!selected) return;

    updateMut.mutate(
      { noteId: selected.id, payload: { isTrashed: true } },
      {
        onSuccess: () => {
          toast.success("Moved to Trash");
          setSelectedId("");
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
    setDraft((d) => ({ ...d, tags: d.tags.filter((x) => x !== t) }));
  };

  return (
    <>
      <NotesListPanel
        q={q}
        onQChange={setQ}
        trashed={trashed}
        isNotesOrTrash={isNotesOrTrash}
        notes={notes}
        selectedId={selectedId}
        onSelect={setSelectedId}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onCreate={createNote}
        createPending={createMut.isPending}
      />

      <NotesEditorPanel
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
      />
    </>
  );
}
