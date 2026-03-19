import FinanceBudgetOverviewCard from "./FinanceBudgetOverviewCard";
import FinanceMonthlyTrendCard from "./FinanceMonthlyTrendCard";
import FinanceRecentTransactionsCard from "./FinanceRecentTransactionsCard";
import FinanceSummaryCards from "./FinanceSummaryCards";
import FinanceTopCategoriesCard from "./FinanceTopCategoriesCard";
import FinanceEmptyState from "../FinanceEmptyState";
import {
  useFinanceBudgetStatus,
  useFinanceDashboardSummary,
  useFinanceTransactions,
} from "@/hooks/useFinanceManager";

const FinanceOverviewTab = () => {
  const {
    data: summary,
    isLoading: isSummaryLoading,
    isError: isSummaryError,
  } = useFinanceDashboardSummary();

  const {
    data: transactions = [],
    isLoading: isTransactionsLoading,
  } = useFinanceTransactions({}, true);

  const {
    data: budgetStatus = [],
    isLoading: isBudgetLoading,
  } = useFinanceBudgetStatus(true);

  if (isSummaryLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="h-32 animate-pulse rounded-3xl border border-border/60 bg-card/70"
            />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <div className="h-80 animate-pulse rounded-3xl border border-border/60 bg-card/70" />
          <div className="h-80 animate-pulse rounded-3xl border border-border/60 bg-card/70" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
          <div className="h-80 animate-pulse rounded-3xl border border-border/60 bg-card/70" />
          <div className="h-80 animate-pulse rounded-3xl border border-border/60 bg-card/70" />
        </div>
      </div>
    );
  }

  if (isSummaryError || !summary) {
    return (
      <FinanceEmptyState
        title="Failed to load finance overview"
        description="Please try again after a moment."
      />
    );
  }

  return (
    <div className="space-y-6">
      <FinanceSummaryCards summary={summary} />

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <FinanceMonthlyTrendCard monthlyTrend={summary.monthlyTrend} />
        <FinanceTopCategoriesCard categories={summary.topExpenseCategories} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <FinanceRecentTransactionsCard
          transactions={transactions.slice(0, 5)}
          isLoading={isTransactionsLoading}
        />
        <FinanceBudgetOverviewCard
          budgets={budgetStatus.slice(0, 5)}
          isLoading={isBudgetLoading}
        />
      </div>
    </div>
  );
};

export default FinanceOverviewTab;