import FinanceSectionHeader from "../FinanceSectionHeader";
import type { FinanceCategorySpendItem } from "@/services/finance_manager.service";

type Props = {
  categories: FinanceCategorySpendItem[];
};

const FinanceTopCategoriesCard = ({ categories }: Props) => {
  return (
    <div className="rounded-3xl border border-border/10 bg-card/5 p-5 shadow-sm">
      <FinanceSectionHeader
        title="Top Categories"
        description="Highest expense categories for the selected period."
      />

      <div className="mt-5 space-y-4">
        {categories.length > 0 ? (
          categories.map((item, idx) => (
            <div
              key={`${item.categoryName}-${idx}`}
              className="rounded-2xl border border-border/50 bg-background/40 px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{item.categoryName}</p>
                  <p className="text-xs text-muted-foreground">
                    Expense category
                  </p>
                </div>
                <div className="text-sm font-semibold">
                  ₹ {item.amount.toLocaleString("en-IN")}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            No category spending data available yet.
          </p>
        )}
      </div>
    </div>
  );
};

export default FinanceTopCategoriesCard;