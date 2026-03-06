import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { usePasslock } from "./usePasslock";
import {
  useCreateVaultItem,
  useDeleteVaultItem,
  useUpdateVaultItem,
  useVaultItems,
} from "@/hooks/useVaultItems";
import type { VaultItem } from "@/services/passlock_items.service";
import {
  decryptVaultSecret,
  encryptVaultSecret,
  type VaultSecretPayload,
} from "@/lib/passlock/itemsCrypto";
import { VaultShell } from "./VaultShell";
import PassLockSettings from "./PassLockSettings";

type Draft = {
  name: string;
  username: string;
  url: string;
  folder: string;
  favorite: boolean;
  password: string;
  notes: string;
};

const EMPTY_DRAFT: Draft = {
  name: "",
  username: "",
  url: "",
  folder: "",
  favorite: false,
  password: "",
  notes: "",
};

export function VaultItemsSection() {
  const { vaultKey } = usePasslock();

  const [view, setView] = useState<"vault" | "settings">("vault");

  const itemsQ = useVaultItems(!!vaultKey);
  const createMut = useCreateVaultItem();
  const updateMut = useUpdateVaultItem();
  const deleteMut = useDeleteVaultItem();

  const items = useMemo(() => itemsQ.data ?? [], [itemsQ.data]);

  const [selectedId, setSelectedId] = useState<string>("");
  const selected = useMemo<VaultItem | null>(
    () => items.find((x) => x.id === selectedId) ?? null,
    [items, selectedId],
  );

  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [baseline, setBaseline] = useState<Draft>(EMPTY_DRAFT);
  const [saveState, setSaveState] = useState<
    "idle" | "dirty" | "saving" | "saved"
  >("idle");
  const [secretDirty, setSecretDirty] = useState(false);
  const [metaDirty, setMetaDirty] = useState(false);

  // If true => dialog is in create mode (no selected item yet)
  const isCreateModeRef = useRef(false);

  // in-memory decrypted cache: itemId -> {password, notes}
  const decryptedSecretsRef = useRef<Record<string, VaultSecretPayload>>({});
  const lastDecryptKeyRef = useRef<string>("");

  const autosaveTimerRef = useRef<number | null>(null);

  function sameSecret(a: Draft, b: Draft) {
    return a.password === b.password && a.notes === b.notes;
  }

  function sameMeta(a: Draft, b: Draft) {
    return (
      a.name === b.name &&
      a.username === b.username &&
      a.url === b.url &&
      a.folder === b.folder &&
      a.favorite === b.favorite
    );
  }

  // auto-select first item ONLY when not in create mode
  useEffect(() => {
    if (isCreateModeRef.current) return;

    if (!items.length) {
      setSelectedId("");
      return;
    }
    if (!selectedId || !items.some((i) => i.id === selectedId)) {
      setSelectedId(items[0].id);
    }
  }, [items, selectedId]);

  // When a selected item exists, load it into draft (decrypt).
  // Skip when in create mode.
  useEffect(() => {
    let alive = true;

    async function loadSelected() {
      if (!vaultKey || !selected) return;
      if (isCreateModeRef.current) return;
      if (metaDirty) return;

      const cached = decryptedSecretsRef.current[selected.id];
      if (cached) {
        const next: Draft = {
          name: selected.name ?? "",
          username: selected.username ?? "",
          url: selected.url ?? "",
          folder: selected.folder ?? "",
          favorite: !!selected.favorite,
          password: cached.password,
          notes: cached.notes,
        };
        if (!alive) return;
        setDraft(next);
        setBaseline(next);
        setSaveState("idle");
        return;
      }

      const decryptKey = `${selected.id}:${selected.updatedAt ?? ""}`;
      if (lastDecryptKeyRef.current === decryptKey) return;
      lastDecryptKeyRef.current = decryptKey;

      try {
        const secret = await decryptVaultSecret(
          vaultKey,
          selected.ciphertext,
          selected.iv,
        );
        decryptedSecretsRef.current[selected.id] = secret;

        const next: Draft = {
          name: selected.name ?? "",
          username: selected.username ?? "",
          url: selected.url ?? "",
          folder: selected.folder ?? "",
          favorite: !!selected.favorite,
          password: secret.password,
          notes: secret.notes,
        };

        if (!alive) return;
        setDraft(next);
        setBaseline(next);
        setSaveState("idle");
      } catch {
        toast.error("Failed to decrypt item (wrong vault key?)");
      }
    }

    void loadSelected();
    return () => {
      alive = false;
    };
  }, [vaultKey, selected, metaDirty]);
  
  // mark dirty/idle (only in edit mode)
  useEffect(() => {
    if (!selected) return;
    if (isCreateModeRef.current) return;

    setSecretDirty(!sameSecret(draft, baseline));
    setMetaDirty(!sameMeta(draft, baseline));
  }, [draft, baseline, selected]);

  const doSecretAutosave = useCallback(
    async (snapshot: Draft, item: VaultItem) => {
      if (!vaultKey) return;

      try {
        const { ciphertext, iv } = await encryptVaultSecret(vaultKey, {
          password: snapshot.password,
          notes: snapshot.notes,
        });

        await updateMut.mutateAsync({
          itemId: item.id,
          payload: {
            ciphertext,
            iv,
          },
        });

        // keep decrypted cache updated
        decryptedSecretsRef.current[item.id] = {
          password: snapshot.password,
          notes: snapshot.notes,
        };

        // only update baseline's secrets, not metadata
        setBaseline((b) => ({
          ...b,
          password: snapshot.password,
          notes: snapshot.notes,
        }));
      } catch {
        toast.error("Autosave failed");
      }
    },
    [vaultKey, updateMut],
  );

  // debounced autosave ONLY in edit mode
  useEffect(() => {
    if (!vaultKey || !selected) return;
    if (isCreateModeRef.current) return;
    if (!secretDirty) return;

    if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);

    const snapshot = draft;
    const item = selected;

    autosaveTimerRef.current = window.setTimeout(() => {
      void doSecretAutosave(snapshot, item);
    }, 700);

    return () => {
      if (autosaveTimerRef.current)
        window.clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    draft.password,
    draft.notes,
    secretDirty,
    vaultKey,
    selected,
    doSecretAutosave,
  ]);

  // Called by VaultShell when user clicks "Add item" (opens dialog)
  const prepareCreateDraft = useCallback(() => {
    isCreateModeRef.current = true;
    setSelectedId(""); // no selection in create mode
    setDraft({ ...EMPTY_DRAFT, name: "" });
    setBaseline(EMPTY_DRAFT);
    setSaveState("idle");
  }, []);

  // Called by VaultShell when list item clicked (edit mode)
  const handleSelect = useCallback((id: string) => {
    isCreateModeRef.current = false;
    setSelectedId(id);
  }, []);

  const saveSelected = useCallback(
    async (mode: "create" | "edit") => {
      if (!vaultKey) return;

      const { ciphertext, iv } = await encryptVaultSecret(vaultKey, {
        password: draft.password,
        notes: draft.notes,
      });

      if (mode === "create") {
        const created = await createMut.mutateAsync({
          name: draft.name.trim() || "Untitled",
          username: draft.username || null,
          url: draft.url || null,
          folder: draft.folder || null,
          favorite: draft.favorite,
          ciphertext,
          iv,
        });

        decryptedSecretsRef.current[created.id] = {
          password: draft.password,
          notes: draft.notes,
        };

        toast.success("Added");
        isCreateModeRef.current = false;
        setSelectedId(created.id);
        setBaseline(draft);
        setSaveState("idle");
        return;
      }

      if (!selected) return;

      const secretPayload = secretDirty
        ? await encryptVaultSecret(vaultKey, {
            password: draft.password,
            notes: draft.notes,
          })
        : null;

      await updateMut.mutateAsync({
        itemId: selected.id,
        payload: {
          name: draft.name.trim() || "Untitled",
          username: draft.username || null,
          url: draft.url || null,
          folder: draft.folder || null,
          favorite: draft.favorite,
          ...(secretPayload
            ? { ciphertext: secretPayload.ciphertext, iv: secretPayload.iv }
            : {}),
        },
      });

      decryptedSecretsRef.current[selected.id] = {
        password: draft.password,
        notes: draft.notes,
      };

      toast.success("Saved");
      setBaseline(draft);
      setSaveState("idle");
    },
    [vaultKey, draft, selected, createMut, updateMut, secretDirty],
  );

  const deleteSelected = useCallback(async () => {
    if (!selected) return;

    try {
      await deleteMut.mutateAsync(selected.id);
      toast.success("Deleted");
      delete decryptedSecretsRef.current[selected.id];
      setSelectedId("");
    } catch {
      toast.error("Delete failed");
    }
  }, [selected, deleteMut]);

  return (
    <>
      {view === "settings" ? (
        <PassLockSettings onBack={() => setView("vault")} />
      ) : (
        <VaultShell
          items={items}
          selectedId={selectedId}
          onSelect={handleSelect}
          draft={draft}
          onDraftChange={setDraft}
          saveState={saveState}
          onCreate={prepareCreateDraft}
          onDeleteSelected={deleteSelected}
          onSaveSelected={saveSelected}
          createPending={createMut.isPending}
          deletePending={deleteMut.isPending}
          saving={updateMut.isPending || createMut.isPending}
          onOpenSettings={() => setView("settings")}
        />
      )}
    </>
  );
}
