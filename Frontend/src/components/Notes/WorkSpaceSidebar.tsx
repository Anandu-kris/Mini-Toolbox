"use client";

import { useState } from "react";
import {
  LayoutGrid,
  ClipboardList,
  Music,
  HelpCircle,
  Code2,
  Trash2,
  Download,
  Layers,
  NotebookPen,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import SidebarNavItem from "@/components/Notes/SideBarNavItem";
import { cn } from "@/lib/utils";

export type Section =
  | "notes"
  | "trash"
  | "tasks"
  | "music"
  | "questions"
  | "dev";

type WorkspaceSidebarProps = {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
  onResetSelection?: () => void;
  title?: string;
};

export function WorkspaceSidebar({
  activeSection,
  onSectionChange,
  onResetSelection,
  title = "Notes",
}: WorkspaceSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const go = (section: Section) => {
    onSectionChange(section);
    onResetSelection?.();
  };

  return (
    <aside
      className={cn(
        "h-full rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300",
        collapsed ? "w-[88px]" : "w-56",
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        {!collapsed && (
          <div className="flex items-center gap-2 font-semibold text-white">
            <NotebookPen className="h-4 w-4" />
            {title}
          </div>
        )}

        <button
          type="button"
          onClick={() => setCollapsed((p) => !p)}
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10",
            collapsed && "mx-auto",
          )}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      <div className="mt-4 space-y-1">
        <SidebarNavItem
          icon={<Layers className="h-4 w-4" />}
          label="Templates"
          active={false}
          collapsed={collapsed}
          onClick={() => toast.info("Coming soon")}
        />
        <SidebarNavItem
          icon={<Download className="h-4 w-4" />}
          label="Import"
          active={false}
          collapsed={collapsed}
          onClick={() => toast.info("Coming soon")}
        />
        <SidebarNavItem
          icon={<Trash2 className="h-4 w-4" />}
          label="Trash"
          active={activeSection === "trash"}
          collapsed={collapsed}
          onClick={() => go("trash")}
        />

        <Separator className="my-4 bg-white/10" />

        {!collapsed && (
          <div className="px-2 text-[11px] uppercase tracking-wider text-white/45">
            WORKSPACE
          </div>
        )}

        <div className="mt-2 space-y-1">
          <SidebarNavItem
            icon={<LayoutGrid className="h-4 w-4" />}
            label="Notes"
            active={activeSection === "notes"}
            collapsed={collapsed}
            onClick={() => go("notes")}
          />
          <SidebarNavItem
            icon={<ClipboardList className="h-4 w-4" />}
            label="Tasks"
            active={activeSection === "tasks"}
            collapsed={collapsed}
            onClick={() => go("tasks")}
          />
          <SidebarNavItem
            icon={<Music className="h-4 w-4" />}
            label="Music"
            active={activeSection === "music"}
            collapsed={collapsed}
            onClick={() => go("music")}
          />
          <SidebarNavItem
            icon={<HelpCircle className="h-4 w-4" />}
            label="Questions"
            active={activeSection === "questions"}
            collapsed={collapsed}
            onClick={() => go("questions")}
          />
          <SidebarNavItem
            icon={<Code2 className="h-4 w-4" />}
            label="Dev"
            active={activeSection === "dev"}
            collapsed={collapsed}
            onClick={() => go("dev")}
          />
        </div>
      </div>
    </aside>
  );
}
