import { cn } from "@/lib/utils";

type SidebarNavItemProps = {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
};

export default function SidebarNavItem({
  icon,
  label,
  active = false,
  collapsed = false,
  onClick,
}: SidebarNavItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={cn(
        "flex w-full items-center rounded-xl border border-transparent text-white/80 transition",
        "hover:bg-white/10 hover:text-white",
        active && "bg-white/10 text-white border-white/10",
        collapsed
          ? "justify-center px-2 py-3"
          : "gap-3 px-3 py-2.5 justify-start",
      )}
    >
      <span className="flex h-5 w-5 items-center justify-center">{icon}</span>

      {!collapsed && <span className="truncate text-sm">{label}</span>}
    </button>
  );
}