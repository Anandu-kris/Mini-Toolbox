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
} from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import  SidebarNavItem  from "@/components/Notes/SideBarNavItem";

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
  const go = (section: Section) => {
    onSectionChange(section);
    onResetSelection?.();
  };

  return (
    <aside className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
      <div className="flex items-center gap-2 text-white font-semibold">
        <NotebookPen className="h-4 w-4" />
        {title}
      </div>

      <div className="mt-4 space-y-1">
        <SidebarNavItem
          icon={<Layers className="h-4 w-4" />}
          label="Templates"
          active={false}
          onClick={() => toast.info("Coming soon")}
        />
        <SidebarNavItem
          icon={<Download className="h-4 w-4" />}
          label="Import"
          active={false}
          onClick={() => toast.info("Coming soon")}
        />
        <SidebarNavItem
          icon={<Trash2 className="h-4 w-4" />}
          label="Trash"
          active={activeSection === "trash"}
          onClick={() => go("trash")}
        />

        <Separator className="my-4 bg-white/10" />

        <div className="text-[11px] uppercase tracking-wider text-white/45 px-2">
          WORKSPACE
        </div>

        <div className="mt-2 space-y-1">
          <SidebarNavItem
            icon={<LayoutGrid className="h-4 w-4" />}
            label="Notes"
            active={activeSection === "notes"}
            onClick={() => go("notes")}
          />
          <SidebarNavItem
            icon={<ClipboardList className="h-4 w-4" />}
            label="Tasks"
            active={activeSection === "tasks"}
            onClick={() => go("tasks")}
          />
          <SidebarNavItem
            icon={<Music className="h-4 w-4" />}
            label="Music"
            active={activeSection === "music"}
            onClick={() => go("music")}
          />
          <SidebarNavItem
            icon={<HelpCircle className="h-4 w-4" />}
            label="Questions"
            active={activeSection === "questions"}
            onClick={() => go("questions")}
          />
          <SidebarNavItem
            icon={<Code2 className="h-4 w-4" />}
            label="Dev"
            active={activeSection === "dev"}
            onClick={() => go("dev")}
          />
        </div>
      </div>
    </aside>
  );
}
