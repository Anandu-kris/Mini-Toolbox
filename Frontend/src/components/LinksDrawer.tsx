// src/components/LinksDrawer.tsx
import { useMemo, useState } from "react";
import { useDebounceValue } from "@/hooks/useDebounceValue";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Loader2,
  Link as LinkIcon,
  RefreshCw,
  Trash2,
  Copy,
  ExternalLink,
  Check,
  Search,
  ChevronRight,
  X,
} from "lucide-react";

import { api } from "@/lib/api";
import { REDIRECT_PREFIX, type UrlItem } from "@/services/url.service";
import { useUrlLinks, useDeleteUrlLink } from "@/hooks/useUrlShortner";

function buildShortUrl(apiBase: string, shortId: string) {
  const origin = new URL(apiBase).origin;
  return `${origin}${REDIRECT_PREFIX}/${shortId}`;
}

export default function LinksDrawer() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const debouncedInput = useDebounceValue(input, 800);
  const API_BASE = (api.defaults.baseURL ?? "") as string;

  const { data: links = [], isFetching, error, refetch } = useUrlLinks(100, open);
  const { mutateAsync: deleteLink, isPending: deleting } = useDeleteUrlLink(100);

  const filtered = useMemo(() => {
    if (!debouncedInput) return links;
    const lower = debouncedInput.toLowerCase();
    return links.filter(
      (u) =>
        u.longUrl.toLowerCase().includes(lower) ||
        u.shortId.toLowerCase().includes(lower)
    );
  }, [links, debouncedInput]);

  async function copyShort(u: UrlItem) {
    await navigator.clipboard.writeText(buildShortUrl(API_BASE, u.shortId));
    setCopiedId(u.shortId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function openShort(u: UrlItem) {
    window.open(buildShortUrl(API_BASE, u.shortId), "_blank");
  }

  async function remove(u: UrlItem) {
    if (!confirm(`Delete ${u.shortId}?`)) return;
    try {
      await deleteLink(u.shortId);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } }; message?: string };
      alert(err?.response?.data?.detail || err?.message || "Delete failed");
    }
  }

  const errMsg = error instanceof Error ? error.message : error ? "Failed to load links" : "";
  const now = Date.now();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');

        .ld-trigger {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 32px;
          padding: 0 12px;
          border-radius: 8px;
          background: rgba(99,102,241,0.12);
          border: 1px solid rgba(99,102,241,0.25);
          color: #a78bfa;
          font-family: 'Sora', sans-serif;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .ld-trigger:hover {
          background: rgba(99,102,241,0.2);
          border-color: rgba(99,102,241,0.4);
          color: #c4b5fd;
        }

        .ld-sheet {
          font-family: 'Sora', sans-serif;
          background: #0f0c1e !important;
          border-left: 1px solid rgba(255,255,255,0.08) !important;
          color: #fff;
          display: flex;
          flex-direction: column;
          padding: 0 !important;
        }

        .ld-header {
          padding: 24px 24px 18px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          position: sticky;
          top: 0;
          z-index: 10;
          background: #0f0c1e;
        }

        .ld-header-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .ld-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ld-title-icon {
          width: 34px; height: 34px;
          border-radius: 10px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 14px rgba(99,102,241,0.4);
          flex-shrink: 0;
        }

        .ld-title {
          font-size: 16px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.02em;
        }

        .ld-subtitle {
          font-size: 11px;
          color: rgba(255,255,255,0.3);
          margin-top: 1px;
        }

        /* Right-side header actions */
        .ld-header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ld-icon-btn {
          width: 32px; height: 32px;
          border-radius: 9px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          color: rgba(255,255,255,0.4);
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .ld-icon-btn:hover {
          background: rgba(255,255,255,0.09);
          color: rgba(255,255,255,0.8);
          border-color: rgba(255,255,255,0.14);
        }

        /* Close button — slightly more prominent */
        .ld-close-btn {
          width: 32px; height: 32px;
          border-radius: 9px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          color: rgba(255,255,255,0.45);
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .ld-close-btn:hover {
          background: rgba(255, 80, 80, 0.12);
          border-color: rgba(255, 80, 80, 0.25);
          color: #ff6b6b;
        }

        /* Divider between refresh and close */
        .ld-header-divider {
          width: 1px;
          height: 18px;
          background: rgba(255,255,255,0.08);
        }

        /* Search */
        .ld-search-wrap {
          position: relative;
        }

        .ld-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255,255,255,0.25);
          pointer-events: none;
        }

        .ld-search {
          width: 100%;
          height: 40px;
          background: rgba(255,255,255,0.05) !important;
          border: 1px solid rgba(255,255,255,0.09) !important;
          border-radius: 12px !important;
          color: #fff !important;
          font-family: 'Sora', sans-serif !important;
          font-size: 13px !important;
          padding: 0 14px 0 38px !important;
          transition: all 0.2s !important;
          outline: none;
        }

        .ld-search::placeholder { color: rgba(255,255,255,0.2) !important; }

        .ld-search:focus {
          border-color: rgba(99,102,241,0.4) !important;
          background: rgba(255,255,255,0.07) !important;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1) !important;
        }

        .ld-body {
          flex: 1;
          overflow-y: auto;
          padding: 16px 24px 28px;
        }

        .ld-body::-webkit-scrollbar { width: 4px; }
        .ld-body::-webkit-scrollbar-track { background: transparent; }
        .ld-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }

        .ld-count {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          color: rgba(255,255,255,0.3);
          margin-bottom: 14px;
          font-family: 'Sora', sans-serif;
        }

        .ld-count-pill {
          background: rgba(99,102,241,0.15);
          border: 1px solid rgba(99,102,241,0.25);
          color: #a78bfa;
          border-radius: 99px;
          padding: 1px 8px;
          font-size: 11px;
          font-weight: 600;
        }

        .ld-error {
          background: rgba(255,80,80,0.08);
          border: 1px solid rgba(255,80,80,0.2);
          border-radius: 12px;
          padding: 10px 14px;
          font-size: 13px;
          color: #ff6b6b;
          margin-bottom: 14px;
        }

        .ld-row {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          padding: 14px 16px;
          margin-bottom: 10px;
          transition: background 0.2s, border-color 0.2s;
        }

        .ld-row:hover {
          background: rgba(255,255,255,0.05);
          border-color: rgba(99,102,241,0.2);
        }

        .ld-row.expired { opacity: 0.5; }

        .ld-row-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 6px;
        }

        .ld-short-id {
          font-size: 13px;
          font-weight: 600;
          color: rgba(255,255,255,0.5);
          font-family: monospace;
          display: flex;
          align-items: center;
          gap: 5px;
          letter-spacing: 0.03em;
        }

        .ld-expired-badge {
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          background: rgba(255,100,100,0.15);
          border: 1px solid rgba(255,100,100,0.25);
          color: #ff6b6b;
          border-radius: 99px;
          padding: 1px 8px;
        }

        .ld-short-url-display {
          font-size: 13px;
          color: #a78bfa;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
          margin-bottom: 14px;
          font-family: 'Sora', sans-serif;
        }

        .ld-long-url {
          font-size: 11px;
          color: rgba(255,255,255,0.25);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
          margin-bottom: 12px;
        }

        .ld-actions {
          display: flex;
          gap: 7px;
          flex-wrap: wrap;
        }

        .ld-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          height: 30px;
          padding: 0 10px;
          border-radius: 8px;
          font-family: 'Sora', sans-serif;
          font-size: 11px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .ld-action-btn.copy {
          background: rgba(99,102,241,0.12);
          border: 1px solid rgba(99,102,241,0.2);
          color: #a78bfa;
        }
        .ld-action-btn.copy:hover { background: rgba(99,102,241,0.2); color: #c4b5fd; }
        .ld-action-btn.copy.copied {
          background: rgba(74,222,128,0.12);
          border-color: rgba(74,222,128,0.3);
          color: #4ade80;
        }

        .ld-action-btn.open {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.09);
          color: rgba(255,255,255,0.55);
        }
        .ld-action-btn.open:hover { background: rgba(255,255,255,0.09); color: #fff; }
        .ld-action-btn.open:disabled { opacity: 0.35; cursor: not-allowed; }

        .ld-action-btn.delete {
          background: rgba(255,80,80,0.08);
          border: 1px solid rgba(255,80,80,0.15);
          color: rgba(255,107,107,0.7);
          margin-left: auto;
        }
        .ld-action-btn.delete:hover { background: rgba(255,80,80,0.15); color: #ff6b6b; border-color: rgba(255,80,80,0.3); }
        .ld-action-btn.delete:disabled { opacity: 0.4; cursor: not-allowed; }

        .ld-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 60px 20px;
          text-align: center;
        }

        .ld-empty-icon {
          width: 52px; height: 52px;
          border-radius: 16px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 6px;
        }

        .ld-empty-title {
          font-size: 14px;
          font-weight: 600;
          color: rgba(255,255,255,0.5);
        }

        .ld-empty-sub {
          font-size: 12px;
          color: rgba(255,255,255,0.2);
        }

        .ld-skeleton {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 14px 16px;
          margin-bottom: 10px;
          animation: ldPulse 1.5s ease-in-out infinite;
        }

        .ld-skeleton-line {
          height: 10px;
          border-radius: 6px;
          background: rgba(255,255,255,0.07);
          margin-bottom: 8px;
        }

        @keyframes ldPulse {
          0%,100% { opacity:1; }
          50%      { opacity:0.5; }
        }
      `}</style>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button className="ld-trigger">
            <LinkIcon size={12}/>
            All Links
            <ChevronRight size={11} style={{ opacity: 0.6 }}/>
          </button>
        </SheetTrigger>

        <SheetContent side="right" className="ld-sheet w-full sm:max-w-lg md:max-w-xl p-0">

          {/* Header */}
          <div className="ld-header">
            <div className="ld-header-top">
              <div className="ld-title-row">
                <div className="ld-title-icon">
                  <LinkIcon size={15} color="#fff"/>
                </div>
                <div>
                  <div className="ld-title">All Short Links</div>
                  <div className="ld-subtitle">Manage your shortened URLs</div>
                </div>
              </div>

              {/* Refresh + Close */}
              <div className="ld-header-actions">
                <button
                  className="ld-icon-btn"
                  onClick={() => refetch()}
                  disabled={isFetching}
                  title="Refresh"
                >
                  {isFetching
                    ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }}/>
                    : <RefreshCw size={14}/>
                  }
                </button>

                <div className="ld-header-divider"/>

                <SheetClose asChild>
                  <button className="ld-close-btn" title="Close">
                    <X size={14}/>
                  </button>
                </SheetClose>
              </div>
            </div>

            {/* Search */}
            <div className="ld-search-wrap">
              <Search size={14} className="ld-search-icon"/>
              <input
                className="ld-search"
                placeholder="Search by URL or short ID…"
                value={input}
                onChange={e => setInput(e.target.value)}
              />
            </div>
          </div>

          {/* Body */}
          <div className="ld-body">
            {errMsg && <div className="ld-error">⚠ {errMsg}</div>}

            {!isFetching && (
              <div className="ld-count">
                <span className="ld-count-pill">{filtered.length}</span>
                {filtered.length === 1 ? 'link' : 'links'} found
              </div>
            )}

            {isFetching && (
              <>
                {[1,2,3].map(i => (
                  <div className="ld-skeleton" key={i}>
                    <div className="ld-skeleton-line" style={{ width: '40%' }}/>
                    <div className="ld-skeleton-line" style={{ width: '75%' }}/>
                    <div className="ld-skeleton-line" style={{ width: '55%', marginBottom: 0 }}/>
                  </div>
                ))}
              </>
            )}

            {!isFetching && filtered.length === 0 && (
              <div className="ld-empty">
                <div className="ld-empty-icon">
                  <LinkIcon size={22} color="rgba(255,255,255,0.2)"/>
                </div>
                <div className="ld-empty-title">No links found</div>
                <div className="ld-empty-sub">
                  {input ? 'Try a different search term' : 'Shorten a URL to see it here'}
                </div>
              </div>
            )}

            {!isFetching && filtered.map(u => {
              const expired = u.expiresAt ? new Date(u.expiresAt).getTime() <= now : false;
              const shortUrl = u.shortUrl ?? buildShortUrl(API_BASE, u.shortId);
              const isCopied = copiedId === u.shortId;

              return (
                <div key={u.shortId} className={`ld-row ${expired ? 'expired' : ''}`}>
                  <div className="ld-row-top">
                    <div className="ld-short-id">
                      <LinkIcon size={10}/>
                      {u.shortId}
                    </div>
                    {expired && <span className="ld-expired-badge">Expired</span>}
                  </div>

                  {/* Short URL — primary */}
                  <div className="ld-short-url-display" title={shortUrl}>{shortUrl}</div>

                  {/* Long URL — secondary */}
                  {/* <div className="ld-long-url" title={u.longUrl}>↳ {u.longUrl}</div> */}

                  <div className="ld-actions">
                    <button className={`ld-action-btn copy ${isCopied ? 'copied' : ''}`} onClick={() => copyShort(u)}>
                      {isCopied ? <Check size={11}/> : <Copy size={11}/>}
                      {isCopied ? 'Copied!' : 'Copy'}
                    </button>

                    <button className="ld-action-btn open" disabled={expired} onClick={() => openShort(u)}>
                      <ExternalLink size={11}/> Open
                    </button>

                    <button className="ld-action-btn delete" disabled={deleting} onClick={() => remove(u)}>
                      <Trash2 size={11}/> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}