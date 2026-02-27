import { Globe, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VaultItem } from "@/services/passlock_items.service";

function hostname(url?: string | null) {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function faviconUrl(url?: string | null) {
  const host = hostname(url);
  if (!host) return "";
  return `https://www.google.com/s2/favicons?domain=${host}&sz=128`;
}

export function VaultItemsList({
  items,
  selectedId,
  onSelect,
}: {
  items: VaultItem[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  if (!items.length) {
    return <div className="text-sm text-white/60 px-2 py-10">No items.</div>;
  }

  return (
    <div
      className={cn(
        "grid gap-4",
        // responsive tile grid similar to your reference
        "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
      )}
    >
      {items.map((it) => {
        const host = hostname(it.url);
        const fav = !!it.favorite;
        const selected = selectedId === it.id;

        return (
          <button
            key={it.id}
            type="button"
            onClick={() => onSelect(it.id)}
            className={cn(
              "group relative w-full text-left",
              "rounded-2xl border transition",
              "border-white/10 bg-white/5 hover:bg-white/8",
              "hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(0,0,0,0.25)]",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20",
              selected && "bg-white/10 border-white/25 ring-1 ring-white/15",
            )}
          >
            {/* top-right tiny actions/markers */}
            {fav ? (
              <span className="absolute right-3 top-3 inline-flex items-center justify-center">
                <Star className="h-4 w-4 text-yellow-300/90" />
              </span>
            ) : null}

            {/* content */}
            <div className="p-4">
              {/* Logo tile */}
              <div
                className={cn(
                  "mx-auto grid place-items-center",
                  "h-14 w-14 rounded-2xl",
                  "bg-white/8 border border-white/10 overflow-hidden",
                  selected && "border-white/20 bg-white/10",
                )}
              >
                {host ? (
                  <img
                    src={faviconUrl(it.url)}
                    alt=""
                    className="h-9 w-9"
                    loading="lazy"
                    onError={(e) => {
                      // fallback to globe if favicon fails
                      const img = e.currentTarget as HTMLImageElement;
                      img.style.display = "none";
                    }}
                  />
                ) : (
                  <Globe className="h-5 w-5 text-white/60" />
                )}
                {/* globe fallback if image hides itself */}
                {host ? (
                  <Globe className="h-5 w-5 text-white/60 hidden" />
                ) : null}
              </div>

              {/* Name */}
              <div className="mt-3 text-sm font-semibold text-white truncate text-center">
                {it.name || "Untitled"}
              </div>

              {/* subtitle (optional) */}
              <div className="mt-1 text-xs text-white/55 truncate text-center">
                {host || it.username || "—"}
              </div>

              {/* bottom row (folder / updated) */}
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-[11px] text-white/45 truncate">
                  {it.folder || ""}
                </span>

                {/* small status dot like your old UI (optional) */}
                <span
                  className={cn(
                    "h-2.5 w-2.5 rounded-full shrink-0",
                    "bg-emerald-300/70",
                    "opacity-80 group-hover:opacity-100",
                  )}
                />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}