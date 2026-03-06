import * as React from "react";
import {
  FileText,
  Highlighter,
  Scissors,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";

import type { AxiosError } from "axios";
import type { UseMutationResult } from "@tanstack/react-query";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  useNotesCopilot,
  useSummarizeNote,
  useShortenNote,
  useHighlightsNote,
} from "@/hooks/useAiNotes";

import type {
  CopilotSource,
  NotesCopilotPayload,
  NotesCopilotResponse,
  NoteActionResponse,
} from "@/services/ai_notes.service";

type ApiErrorBody = { detail?: string; message?: string };
type TabKey = "ask" | "summarize" | "shorten" | "highlights";

type AiFloatingPanelProps = {
  noteId?: string | null;
  disabled?: boolean;
  onOpenSource?: (noteId: string, snippet: string) => void;
  onApplyToEditor?: (plainText: string) => void;
  className?: string;
};

function getErrMessage(err: unknown): string {
  const e = err as AxiosError<ApiErrorBody>;
  return (
    e?.response?.data?.detail ||
    e?.response?.data?.message ||
    e?.message ||
    "Something went wrong"
  );
}

export function AiFloatingPanel({
  noteId,
  disabled = false,
  onOpenSource,
  onApplyToEditor,
  className,
}: AiFloatingPanelProps) {
  const [open, setOpen] = React.useState(false);
  const [tab, setTab] = React.useState<TabKey>("ask");
  const [query, setQuery] = React.useState("");


  const panelRef = React.useRef<HTMLDivElement | null>(null);

  const copilot = useNotesCopilot() as UseMutationResult<
    NotesCopilotResponse,
    AxiosError<ApiErrorBody>,
    NotesCopilotPayload,
    unknown
  >;

  const summarize = useSummarizeNote() as UseMutationResult<
    NoteActionResponse,
    AxiosError<ApiErrorBody>,
    string,
    unknown
  >;

  const shorten = useShortenNote() as UseMutationResult<
    NoteActionResponse,
    AxiosError<ApiErrorBody>,
    string,
    unknown
  >;

  const highlights = useHighlightsNote() as UseMutationResult<
    NoteActionResponse,
    AxiosError<ApiErrorBody>,
    string,
    unknown
  >;

  const busy =
    copilot.isPending ||
    summarize.isPending ||
    shorten.isPending ||
    highlights.isPending;

  // Close on outside click + Esc
  React.useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    function onMouseDown(e: MouseEvent) {
      const el = panelRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousedown", onMouseDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onMouseDown);
    };
  }, [open]);

  async function runAsk() {
    const q = query.trim();
    if (!q || disabled) return;
    setTab("ask");
    await copilot.mutateAsync({ query: q, top_k: 6 });
  }

  async function runSummarize() {
    if (!noteId || disabled) return;
    setTab("summarize");
    await summarize.mutateAsync(noteId);
  }

  async function runShorten() {
    if (!noteId || disabled) return;
    setTab("shorten");
    await shorten.mutateAsync(noteId);
  }

  async function runHighlights() {
    if (!noteId || disabled) return;
    setTab("highlights");
    await highlights.mutateAsync(noteId);
  }

  const sources: CopilotSource[] = copilot.data?.sources ?? [];

  const errorMessage =
    (copilot.error && getErrMessage(copilot.error)) ||
    (summarize.error && getErrMessage(summarize.error)) ||
    (shorten.error && getErrMessage(shorten.error)) ||
    (highlights.error && getErrMessage(highlights.error)) ||
    "";

  const handleClick = () => {
  setOpen((v) => !v);
};

  return (
    <div className={cn("absolute bottom-5 right-5 z-50", className)}>
      {/* Panel */}
      <div
        ref={panelRef}
        className={cn(
          "absolute bottom-[60px] right-0 w-[360px] origin-bottom-right",
          "transition-all duration-200",
          open
            ? "scale-100 opacity-100 translate-y-0 pointer-events-auto"
            : "scale-95 opacity-0 translate-y-2 pointer-events-none",
        )}
      >
        <Card
          className={cn(
            "overflow-hidden rounded-2xl border border-white/12",
            "bg-gray-900 backdrop-blur-xl",
            "shadow-[0_18px_60px_rgba(0,0,0,0.35)]",
          )}
        >
          {/* header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-white/8 border border-white/10 grid place-items-center">
                <Sparkles className="h-4 w-4 text-indigo-500 animate-pulse" />
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold text-white">Notes AI</div>
                <div className="text-xs text-white/55">
                  {disabled ? "Disabled" : noteId ? "Ready" : "Select a note"}
                </div>
              </div>
            </div>

            <Button
              size="icon"
              variant="ghost"
              className="text-white/70 hover:text-white hover:bg-white/10"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* body */}
          <div className="p-4 space-y-3">
            <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
              <TabsList className="grid grid-cols-4 bg-white/5 border border-white/10">
                <TabsTrigger value="ask" className="text-xs text-blue-300">
                  <Wand2 className="h-3.5 w-3.5 mr-1" />
                  Ask
                </TabsTrigger>
                <TabsTrigger
                  value="summarize"
                  className="text-xs text-green-300"
                >
                  <FileText className="h-3.5 w-3.5 mr-1" />
                  Sum
                </TabsTrigger>
                <TabsTrigger
                  value="shorten"
                  className="text-xs text-purple-300"
                >
                  <Scissors className="h-3.5 w-3.5 mr-1" />
                  Short
                </TabsTrigger>
                <TabsTrigger
                  value="highlights"
                  className="text-xs text-amber-300"
                >
                  <Highlighter className="h-3.5 w-3.5 mr-1" />
                  Key
                </TabsTrigger>
              </TabsList>

              {/* ASK */}
              <TabsContent value="ask" className="mt-3 space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") runAsk();
                    }}
                    placeholder="Ask across your notes…"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    disabled={disabled}
                  />
                  <Button
                    onClick={runAsk}
                    disabled={disabled || busy || !query.trim()}
                    className="shrink-0"
                  >
                    {copilot.isPending ? "…" : "Go"}
                  </Button>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-white/90 whitespace-pre-wrap min-h-11">
                  {copilot.isPending
                    ? "Thinking…"
                    : copilot.data?.answer
                      ? copilot.data.answer
                      : "💡Tip: “what did I write about docker compose?”"}
                </div>

                {sources.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-xs uppercase tracking-wide text-white/55">
                      Sources
                    </div>
                    <div className="max-h-[140px] overflow-auto space-y-2 pr-1">
                      {sources.slice(0, 6).map((s, idx) => {
                        const snippet = s.snippet ?? "";
                        const chunkLabel =
                          typeof s.chunkIndex === "number"
                            ? `chunk ${s.chunkIndex}`
                            : `chunk`;

                        return (
                          <button
                            key={`${s.noteId}:${s.chunkIndex ?? idx}`}
                            type="button"
                            onClick={() => onOpenSource?.(s.noteId, snippet)}
                            className="w-full text-left rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 p-2"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="text-xs text-white/60">
                                {s.title ? s.title : `Note: ${s.noteId}`}
                              </div>
                              <Badge className="bg-white/10 text-white border border-white/10">
                                {chunkLabel}
                              </Badge>
                            </div>

                            <div className="text-sm text-white/85 line-clamp-2">
                              {snippet || "No snippet available"}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </TabsContent>

              {/* SUMMARIZE */}
              <TabsContent value="summarize" className="mt-3 space-y-2">
                <Button
                  onClick={runSummarize}
                  disabled={disabled || busy || !noteId}
                  className="w-full"
                  variant="secondary"
                >
                  {summarize.isPending ? "Summarizing…" : "Summarize this note"}
                </Button>

                <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/90 whitespace-pre-wrap min-h-[140px]">
                  {summarize.isPending
                    ? "Working…"
                    : summarize.data?.result || "Click to generate a summary."}
                </div>
              </TabsContent>

              {/* SHORTEN */}
              <TabsContent value="shorten" className="mt-3 space-y-2">
                <div className="flex gap-2">
                  <Button
                    onClick={runShorten}
                    disabled={disabled || busy || !noteId}
                    className="flex-1"
                    variant="secondary"
                  >
                    {shorten.isPending ? "Shortening…" : "Shorten note"}
                  </Button>

                  <Button
                    onClick={() => {
                      const txt = shorten.data?.result;
                      if (txt) onApplyToEditor?.(txt);
                    }}
                    disabled={!shorten.data?.result || !onApplyToEditor}
                    className="shrink-0"
                  >
                    Apply
                  </Button>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/90 whitespace-pre-wrap min-h-[140px]">
                  {shorten.isPending
                    ? "Working…"
                    : shorten.data?.result || "Click to rewrite shorter."}
                </div>
              </TabsContent>

              {/* HIGHLIGHTS */}
              <TabsContent value="highlights" className="mt-3 space-y-2">
                <Button
                  onClick={runHighlights}
                  disabled={disabled || busy || !noteId}
                  className="w-full"
                  variant="secondary"
                >
                  {highlights.isPending ? "Extracting…" : "Get key highlights"}
                </Button>

                <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/90 whitespace-pre-wrap min-h-[140px]">
                  {highlights.isPending
                    ? "Working…"
                    : highlights.data?.result ||
                      "Click to extract action items & key points."}
                </div>
              </TabsContent>
            </Tabs>

            {errorMessage ? (
              <div className="text-xs text-red-300">{errorMessage}</div>
            ) : null}
          </div>
        </Card>
      </div>

      {/* Floating pill button */}
      <div style={{ position: "relative", display: "inline-flex" }}>
        <button
          type="button"
          onClick={handleClick}
          className={cn(
            "group relative flex items-center gap-2 rounded-full px-4 h-12",
            "transition-all duration-300",
            "hover:-translate-y-0.5 hover:scale-[1.03]",
            "active:scale-[0.97]",
            disabled && "opacity-60 pointer-events-none",
          )}
          style={{ animation: "float 3s ease-in-out infinite" }}
          aria-label="Open Notes AI"
        >

          {/* <span className="absolute inset-0 rounded-full bg-[#0b0b10]/80 border border-white/8 backdrop-blur-xl shadow-[0_16px_40px_rgba(0,0,0,0.45)]" /> */}

          {/* <span
            className="absolute top-2 right-3 w-1.5 h-1.5 rounded-full bg-emerald-400 z-10"
            style={{ boxShadow: "0 0 6px #34d399" }}
          /> */}

          <span className="relative flex items-center gap-2 z-10">
            <span
              className="relative grid place-items-center h-10 w-10 rounded-full border border-white/10"
              style={{
                background: "linear-gradient(135deg, #1e293b, #0f172a)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07)",
              }}
            >
              <span
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle at 40% 35%, rgba(34,211,238,0.2), transparent 70%)",
                }}
              />
              <Sparkles className="h-5 w-5 text-sky-300 relative z-10 animate-pulse" />
            </span>

            {/* <span
              className="text-sm font-bold tracking-widest"
              style={{
                background: "linear-gradient(90deg, #e2e8f0, #94a3b8, #e2e8f0)",
                backgroundSize: "200%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                animation: "shimmer 3s ease infinite",
              }}
            >
              AI
            </span> */}
          </span>
        </button>
      </div>
    </div>
  );
}
