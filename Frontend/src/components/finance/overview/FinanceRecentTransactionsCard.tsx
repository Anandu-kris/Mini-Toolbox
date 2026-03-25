import FinanceSectionHeader from "../FinanceSectionHeader";
import type { FinanceTransactionItem } from "@/services/finance_manager.service";

type Props = {
  transactions: FinanceTransactionItem[];
  isLoading?: boolean;
};

const FinanceRecentTransactionsCard = ({
  transactions,
  isLoading = false,
}: Props) => {
  return (
    <div className="rounded-3xl border border-border/10 bg-card/5 p-5 shadow-sm">
      <FinanceSectionHeader
        title="Recent Transactions"
        description="Your latest finance activity."
      />

      <div className="mt-5 space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="h-16 animate-pulse rounded-2xl border border-border/50 bg-background/40"
            />
          ))
        ) : transactions.length > 0 ? (
          transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between rounded-2xl border border-border/30 bg-background/20 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">{tx.title}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(tx.transactionDate).toLocaleDateString()}
                </p>
              </div>

              <div className="text-right">
                <p className="text-sm font-semibold">
                  ₹ {tx.amount.toLocaleString("en-IN")}
                </p>
                <p className="text-xs capitalize text-muted-foreground">
                  {tx.type}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            No recent transactions yet.
          </p>
        )}
      </div>
    </div>
  );
};

export default FinanceRecentTransactionsCard;