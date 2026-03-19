import FinanceSectionHeader from "../FinanceSectionHeader";
import type { FinanceBudgetStatusItem } from "@/services/finance_manager.service";

type Props = {
  budgets: FinanceBudgetStatusItem[];
  isLoading?: boolean;
};

const FinanceBudgetOverviewCard = ({
  budgets,
  isLoading = false,
}: Props) => {
  return (
    <div className="rounded-3xl border border-border/10 bg-card/5 p-5 shadow-sm">
      <FinanceSectionHeader
        title="Budget Overview"
        description="Track active budgets and usage."
      />

      <div className="mt-5 space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="h-24 animate-pulse rounded-2xl border border-border/50 bg-background/40"
            />
          ))
        ) : budgets.length > 0 ? (
          budgets.map((budget) => (
            <div
              key={budget.budgetId}
              className="rounded-2xl border border-border/50 bg-background/40 px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">{budget.budgetName}</p>
                <span className="text-xs font-medium text-muted-foreground">
                  {budget.usedPercentage}%
                </span>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{
                    width: `${Math.min(budget.usedPercentage, 100)}%`,
                  }}
                />
              </div>

              <p className="mt-2 text-xs text-muted-foreground">
                ₹ {budget.spentAmount.toLocaleString("en-IN")} / ₹{" "}
                {budget.budgetAmount.toLocaleString("en-IN")}
              </p>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            No budget data available yet.
          </p>
        )}
      </div>
    </div>
  );
};

export default FinanceBudgetOverviewCard;