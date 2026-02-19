import React from "react";
import { cn } from "@/lib/utils";

type SidebarNavItemProps = {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
};

export default function SidebarNavItem({
  icon,
  label,
  active = false,
  onClick,
}: SidebarNavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition",
        "text-white/70 hover:text-white hover:bg-white/8",
        active && "bg-white/10 text-white border border-white/10",
      )}
    >
      <span className="text-white/70">{icon}</span>
      <span>{label}</span>
    </button>
  );
}
