import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Star,
  Folder,
  Search,
  Plus,
  Settings,
  KeyRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import type { VaultItem } from "@/services/passlock_items.service";
import { VaultStatsRow } from "./VaultStatRow";
import { VaultItemDialog, type Draft } from "./VaultItemDialog";
import { VaultItemsList } from "./VaultItemsList";
import { VaultAutoLockStatus } from "./VaultAutoLockStatus";

export function VaultShell({
  items,
  selectedId,
  onSelect,
  draft,
  onDraftChange,
  saveState,

  onCreate, // now: just prepare draft for create (no DB write)
  onDeleteSelected,
  onSaveSelected, // will handle create vs edit in VaultItemsSection based on "mode"

  createPending,
  deletePending,
  saving,
  onOpenSettings,
  stats,
}: {
  items: VaultItem[];
  selectedId: string;
  onSelect: (id: string) => void;

  draft: Draft;
  onDraftChange: (next: Draft | ((prev: Draft) => Draft)) => void;

  saveState: "idle" | "dirty" | "saving" | "saved";

  onCreate: () => void;
  onDeleteSelected: () => void;
  onSaveSelected: (mode: "create" | "edit") => Promise<void>;

  createPending?: boolean;
  deletePending?: boolean;
  saving?: boolean;

  onOpenSettings: () => void;
  stats?: { total: number; fav: number; strong?: number; weak?: number };
}) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"all" | "fav">("all");
  const [folder, setFolder] = useState<string>("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("edit");

  const folders = useMemo(() => {
    const s = new Set<string>();
    for (const it of items) if (it.folder) s.add(it.folder);
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return items
      .filter((it) => (tab === "fav" ? !!it.favorite : true))
      .filter((it) => (folder ? (it.folder || "") === folder : true))
      .filter((it) => {
        if (!query) return true;
        const hay = [it.name, it.username ?? "", it.url ?? "", it.folder ?? ""]
          .join(" ")
          .toLowerCase();
        return hay.includes(query);
      });
  }, [items, q, tab, folder]);

  const total = items.length;
  const fav = useMemo(() => items.filter((x) => x.favorite).length, [items]);

  const glass =
    "border border-white/10 bg-white/[0.06] backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.35)]";

  return (
    <div className="h-full min-h-0 w-full max-w-full mx-auto">
      <div className="grid gap-6 lg:grid-cols-[280px_1fr] h-full min-h-0 w-full">
        {/* Sidebar */}
        <aside
          className={cn("rounded-3xl p-4 flex flex-col h-full min-h-0", glass)}
        >
          {" "}
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="h-11 w-11 rounded-2xl bg-white/10 grid place-items-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-white font-semibold leading-tight">
                PassLock
              </div>
              <div className="text-xs text-white/60">Vault</div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <button
              type="button"
              onClick={() => {
                setTab("all");
                setFolder("");
              }}
              className={cn(
                "w-full rounded-2xl px-3 py-2.5 text-left transition flex items-center gap-3",
                tab === "all" && !folder ? "bg-white/10" : "hover:bg-white/8",
              )}
            >
              <Shield className="h-4 w-4 text-white/70" />
              <span className="text-white/90 text-sm">All items</span>
              <Badge className="ml-auto bg-white/10 text-white/70 border-white/10">
                {items.length}
              </Badge>
            </button>

            <button
              type="button"
              onClick={() => {
                setTab("fav");
                setFolder("");
              }}
              className={cn(
                "w-full rounded-2xl px-3 py-2.5 text-left transition flex items-center gap-3",
                tab === "fav" && !folder ? "bg-white/10" : "hover:bg-white/8",
              )}
            >
              <Star className="h-4 w-4 text-yellow-300/90" />
              <span className="text-white/90 text-sm">Favorites</span>
              <Badge className="ml-auto bg-white/10 text-white/70 border-white/10">
                {items.filter((x) => x.favorite).length}
              </Badge>
            </button>
          </div>
          <div className="mt-5 px-1">
            <Accordion
              type="multiple"
              defaultValue={["folders"]}
              className="space-y-2"
            >
              {/* Folders */}
              <AccordionItem
                value="folders"
                className="border border-white/10 rounded-2xl bg-white/3"
              >
                <AccordionTrigger className="px-3 py-2.5 hover:no-underline text-white/85">
                  <span className="text-xs text-white/80">Folders</span>
                </AccordionTrigger>

                <AccordionContent className="px-2 pb-2">
                  {folders.length === 0 ? (
                    <div className="text-sm text-white/50 px-2 py-2">
                      No folders yet.
                    </div>
                  ) : (
                    <ScrollArea className="max-h-52 pr-2">
                      <div className="space-y-1">
                        {folders.map((f) => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => {
                              setFolder(f);
                              setTab("all");
                            }}
                            className={cn(
                              "w-full rounded-2xl px-3 py-2 text-left transition flex items-center gap-3",
                              folder === f ? "bg-white/10" : "hover:bg-white/8",
                            )}
                          >
                            <Folder className="h-4 w-4 text-white/60" />
                            <span className="text-sm text-white/85 truncate">
                              {f}
                            </span>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* Features */}
              <AccordionItem
                value="features"
                className="border border-white/10 rounded-2xl bg-white/3"
              >
                <AccordionTrigger className="px-3 py-2.5 hover:no-underline text-white/85">
                  <span className="text-xs text-white/80">Features</span>
                </AccordionTrigger>

                <AccordionContent className="px-2 pb-2">
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => navigate("/home/password-generator")}
                      className={cn(
                        "w-full rounded-2xl px-3 py-2.5 text-left transition flex items-center gap-3",
                        "hover:bg-white/8",
                      )}
                    >
                      <KeyRound className="h-4 w-4 text-white/70" />
                      <span className="text-white/90 text-sm">
                        Password generator
                      </span>
                    </button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </aside>
        {/* Main */}
        <main className="flex flex-col h-full min-h-0 space-y-5">
          {" "}
          {/* Topbar */}
          <div className={cn("rounded-3xl p-4", glass)}>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="text-white font-semibold text-lg">
                  Vault items
                </div>
                <div className="text-xs text-white/55">
                  {saveState === "saving"
                    ? "Saving…"
                    : saveState === "saved"
                      ? "Saved"
                      : saveState === "dirty"
                        ? "Unsaved changes"
                        : "Up to date"}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <VaultAutoLockStatus />
                <Button
                  variant="secondary"
                  className="bg-white/8 border border-white/10 hover:bg-white/12 text-white"
                  onClick={onOpenSettings}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>

                <Button
                  onClick={() => {
                    onCreate();
                    setDialogMode("create");
                    setDialogOpen(true);
                  }}
                  disabled={createPending}
                  className="bg-white/10 hover:bg-white/15 border border-white/10"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add item
                </Button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search name, username, URL, folder…"
                  className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/35"
                />
              </div>
            </div>

            <div className="mt-4">
              <VaultStatsRow
                total={stats?.total ?? total}
                fav={stats?.fav ?? fav}
                strong={stats?.strong}
                weak={stats?.weak}
              />
            </div>
          </div>
          {/* List area */}
          <div
            className={cn(
              "rounded-3xl p-4 flex-1 min-h-0 overflow-auto",
              glass,
            )}
          >
            {" "}
            <VaultItemsList
              items={filtered}
              selectedId={selectedId}
              onSelect={(id) => {
                onSelect(id);
                setDialogMode("edit");
                setDialogOpen(true);
              }}
            />
          </div>
          {/* Editor dialog */}
          <VaultItemDialog
            open={dialogOpen}
            mode={dialogMode}
            draft={draft}
            onDraftChange={onDraftChange}
            saving={!!saving}
            deletePending={!!deletePending}
            onClose={() => setDialogOpen(false)}
            onDelete={() => {
              onDeleteSelected();
              setDialogOpen(false);
            }}
            onPrimary={async () => {
              await onSaveSelected(dialogMode);
              setDialogOpen(false);
            }}
          />
        </main>
      </div>
    </div>
  );
}
