import {
  BarChart3,
  CreditCard,
  FolderTree,
  Landmark,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FinanceTabKey } from "@/types/finance_manager.types";

const tabs: {
  key: FinanceTabKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "overview", label: "Overview", icon: BarChart3 },
  { key: "transactions", label: "Transactions", icon: Receipt },
  { key: "accounts", label: "Accounts", icon: Landmark },
  { key: "categories", label: "Categories", icon: FolderTree },
  { key: "budgets", label: "Budgets", icon: CreditCard },
];

type Props = {
  activeTab: FinanceTabKey;
  onChange: (tab: FinanceTabKey) => void;
};

const FinanceTabs = ({ activeTab, onChange }: Props) => {
  return (
    <div className="w-full overflow-x-auto">
      <div
        className="
          inline-grid min-w-full grid-cols-5 rounded-2xl
          border border-purple-500/40
          p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.28)]
          backdrop-blur-xl
        "
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium whitespace-nowrap",
                "border border-transparent transition-colors duration-200",
                isActive
                  ? "bg-white/10 text-white border-white/10"
                  : "text-slate-300/85 hover:bg-white/4 hover:text-white"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors duration-200",
                  isActive ? "text-white" : "text-slate-400"
                )}
              />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FinanceTabs;