import { useMemo, useState } from "react";
import {
  Copy,
  Eye,
  EyeOff,
  ExternalLink,
  Trash2,
  Star,
  StarOff,
  Plus,
  Save,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export type Draft = {
  name: string;
  username: string;
  url: string;
  folder: string;
  favorite: boolean;
  password: string;
  notes: string;
};

export function VaultItemDialog({
  open,
  mode,
  draft,
  onDraftChange,
  saving,
  deletePending,
  onClose,
  onDelete,
  onPrimary,
}: {
  open: boolean;
  mode: "create" | "edit";

  draft: Draft;
  onDraftChange: (next: Draft | ((prev: Draft) => Draft)) => void;

  saving: boolean;
  deletePending: boolean;

  onClose: () => void;
  onDelete: () => void; // only used in edit mode
  onPrimary: () => Promise<void>; // Add / Save
}) {
  const [reveal, setReveal] = useState(false);

  const host = useMemo(() => {
    if (!draft.url) return "";
    try {
      return new URL(draft.url).hostname.replace(/^www\./, "");
    } catch {
      return "";
    }
  }, [draft.url]);

  async function copy(text: string, label: string) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
      window.setTimeout(() => navigator.clipboard.writeText(""), 20_000);
    } catch {
      toast.error("Copy failed");
    }
  }

  const title =
    mode === "create"
      ? "Add item"
      : draft.name?.trim()
        ? draft.name
        : "Edit item";

  const canPrimary = !!draft.name.trim();

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : undefined)}>
      <DialogContent className="max-w-4xl w-full p-6 md:p-8 border border-white/10 bg-[rgba(20,16,40,0.70)] backdrop-blur-2xl text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-3 mt-6">
            <div className="min-w-0">
              <div className="text-lg font-semibold truncate">{title}</div>
              <div className="text-xs text-white/50">
                {host
                  ? host
                  : "Secrets stay encrypted in DB (decrypt only in memory)"}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                className={cn(
                  "h-10 w-10 p-0 flex items-center justify-center",
                  "bg-white/8 border border-white/10 hover:bg-white/12 text-white/50",
                  draft.favorite && "bg-white/12 ring-1 ring-yellow-300/30",
                )}
                onClick={() =>
                  onDraftChange((d) => ({ ...d, favorite: !d.favorite }))
                }
              >
                {draft.favorite ? (
                  <>
                    <Star className="h-4 w-4 text-yellow-300/90" />
                  </>
                ) : (
                  <>
                    <StarOff className="h-4 w-4" />
                  </>
                )}
              </Button>

              {mode === "edit" ? (
                <Button
                  type="button"
                  variant="destructive"
                  disabled={deletePending}
                  onClick={onDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              ) : null}
            </div>
          </DialogTitle>
        </DialogHeader>

        <Separator className="bg-white/10" />

        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-6">
            <div className="grid gap-2">
              <Label className="text-white/80">Name</Label>
              <Input
                value={draft.name}
                onChange={(e) =>
                  onDraftChange((d) => ({ ...d, name: e.target.value }))
                }
                className="bg-white/5 border-white/10 text-white placeholder:text-white/35"
                placeholder="GitHub, Gmail, Netflix…"
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-white/80">Username / Email</Label>
              <div className="flex gap-2">
                <Input
                  value={draft.username}
                  onChange={(e) =>
                    onDraftChange((d) => ({ ...d, username: e.target.value }))
                  }
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/35"
                  placeholder="name@example.com"
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="bg-white/8 border border-white/10 hover:bg-white/12 text-white"
                  onClick={() => copy(draft.username, "Username")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="text-white/80">Website</Label>
              <div className="flex gap-2">
                <Input
                  value={draft.url}
                  onChange={(e) =>
                    onDraftChange((d) => ({ ...d, url: e.target.value }))
                  }
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/35"
                  placeholder="https://github.com"
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="bg-white/8 border border-white/10 hover:bg-white/12 text-white"
                  disabled={!draft.url}
                  onClick={() => window.open(draft.url, "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="text-white/80">Folder</Label>
              <Input
                value={draft.folder}
                onChange={(e) =>
                  onDraftChange((d) => ({ ...d, folder: e.target.value }))
                }
                className="bg-white/5 border-white/10 text-white placeholder:text-white/35"
                placeholder="Work, Personal, Banking…"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label className="text-white/80">Password</Label>
              <div className="flex gap-2">
                <Input
                  type={reveal ? "text" : "password"}
                  value={draft.password}
                  onChange={(e) =>
                    onDraftChange((d) => ({ ...d, password: e.target.value }))
                  }
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/35"
                  placeholder="••••••••••••"
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="bg-white/8 border border-white/10 hover:bg-white/12 text-white"
                  onClick={() => setReveal((v) => !v)}
                >
                  {reveal ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="bg-white/8 border border-white/10 hover:bg-white/12 text-white"
                  onClick={() => copy(draft.password, "Password")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-xs text-white/45">
                Tip: clipboard auto-clears in 20 seconds.
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="text-white/80">Notes</Label>
              <Textarea
                value={draft.notes}
                onChange={(e) =>
                  onDraftChange((d) => ({ ...d, notes: e.target.value }))
                }
                className="min-h-[200px] bg-white/5 border-white/10 text-white placeholder:text-white/35"
                placeholder="Security questions, recovery codes, hints…"
              />
            </div>

            <div className="flex justify-end gap-5 pt-2">
              <Button
                type="button"
                variant="secondary"
                className="bg-white/8 border border-white/10 hover:bg-white/12 text-white/50 hover:text-white/80"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={() => void onPrimary()}
                disabled={saving || !canPrimary}
                className="bg-white/10 hover:bg-white/15 border border-white/10"
              >
                {mode === "create" ? (
                  <Plus className="h-4 w-4 mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {saving
                  ? mode === "create"
                    ? "Adding…"
                    : "Saving…"
                  : mode === "create"
                    ? "Add"
                    : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
