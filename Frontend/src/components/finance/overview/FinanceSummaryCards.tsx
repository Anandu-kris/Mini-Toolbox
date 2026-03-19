import {
  ArrowDownCircle,
  ArrowUpCircle,
  PiggyBank,
  Wallet,
} from "lucide-react";
import FinanceStatCard from "./FinanceStatCard";
import type { FinanceDashboardSummary } from "@/services/finance_manager.service";

type Props = {
  summary: FinanceDashboardSummary;
};

const FinanceSummaryCards = ({ summary }: Props) => {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <FinanceStatCard
        accent="blue"
        title="Total Balance"
        value={`₹ ${summary.totalBalance.toLocaleString("en-IN")}`}
        helper="Across all active accounts"
        icon={<Wallet className="h-5 w-5" />}
      />
      <FinanceStatCard
        accent="emerald"
        title="Income"
        value={`₹ ${summary.totalIncome.toLocaleString("en-IN")}`}
        helper="For selected period"
        icon={<ArrowUpCircle className="h-5 w-5" />}
      />
      <FinanceStatCard
        accent="rose"
        title="Expense"
        value={`₹ ${summary.totalExpense.toLocaleString("en-IN")}`}
        helper="For selected period"
        icon={<ArrowDownCircle className="h-5 w-5" />}
      />
      <FinanceStatCard
        accent="violet"
        title="Net Savings"
        value={`₹ ${summary.netSavings.toLocaleString("en-IN")}`}
        helper="Income - expense"
        icon={<PiggyBank className="h-5 w-5" />}
      />
    </div>
  );
};

export default FinanceSummaryCards;
