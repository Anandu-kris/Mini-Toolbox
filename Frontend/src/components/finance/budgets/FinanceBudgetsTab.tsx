import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import FinanceSectionHeader from "../FinanceSectionHeader";
import AddBudgetDialog from "./AddBudgetDialog";
import EditBudgetDialog from "./EditBudgetDialog";
import FinanceEmptyState from "../FinanceEmptyState";
import ConfirmDeleteDialog from "../ConfirmDeleteDialog";
import type { FinanceBudgetItem } from "@/services/finance_manager.service";
import {
  useCreateFinanceBudget,
  useDeleteFinanceBudget,
  useFinanceBudgetStatus,
  useFinanceBudgets,
  useFinanceCategories,
  useUpdateFinanceBudget,
} from "@/hooks/useFinanceManager";
import { OrbitLoader } from "@/components/ui/Loader";

const FinanceBudgetsTab = () => {
  const [openAddBudget, setOpenAddBudget] = useState(false);
  const [editingBudget, setEditingBudget] = useState<FinanceBudgetItem | null>(
    null,
  );
  const [deletingBudget, setDeletingBudget] =
    useState<FinanceBudgetItem | null>(null);

  const {
    data: budgetStatus = [],
    isLoading,
    isError,
  } = useFinanceBudgetStatus();
  const { data: budgets = [] } = useFinanceBudgets();
  const { data: categories = [] } = useFinanceCategories({ type: "expense" });

  const createBudget = useCreateFinanceBudget();
  const updateBudget = useUpdateFinanceBudget();
  const deleteBudget = useDeleteFinanceBudget();

  const expenseCategories = useMemo(
    () =>
      categories.map((c) => ({
        id: c.id,
        name: c.name,
      })),
    [categories],
  );

  const budgetMap = useMemo(() => {
    return new Map(budgets.map((item) => [item.id, item]));
  }, [budgets]);

  return (
    <>
      <div className="space-y-5">
        <FinanceSectionHeader
          title="Budgets"
          description="Set spending limits and monitor usage."
          action={
            <Button
              className="text-white rounded-2xl bg-linear-to-br  from-purple-600 to-blue-500 hover:bg-linear-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium text-sm px-4 py-2.5 text-center leading-5"
              onClick={() => setOpenAddBudget(true)}
            >
              <Plus />
              Add Budget
            </Button>
          }
        />

        {isLoading ? (
          <OrbitLoader />
        ) : isError ? (
          <FinanceEmptyState
            title="Failed to load budgets"
            description="Please try again after a moment."
          />
        ) : budgetStatus.length === 0 ? (
          <FinanceEmptyState
            title="No budgets yet"
            description="Create a budget to track category-wise spending limits."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {budgetStatus.map((budget) => {
              const originalBudget = budgetMap.get(budget.budgetId);

              return (
                <div
                  key={budget.budgetId}
                  className="rounded-3xl border border-border/10 bg-card/5 p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold">
                        {budget.budgetName}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Budget: ₹ {budget.budgetAmount.toLocaleString("en-IN")}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          originalBudget && setEditingBudget(originalBudget)
                        }
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          originalBudget && setDeletingBudget(originalBudget)
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 text-sm font-semibold">
                    {budget.usedPercentage}%
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${Math.min(budget.usedPercentage, 100)}%`,
                      }}
                    />
                  </div>

                  <p className="mt-3 text-sm text-muted-foreground">
                    Spent: ₹ {budget.spentAmount.toLocaleString("en-IN")}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Remaining: ₹{" "}
                    {budget.remainingAmount.toLocaleString("en-IN")}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AddBudgetDialog
        open={openAddBudget}
        onOpenChange={setOpenAddBudget}
        categories={expenseCategories}
        onSubmit={async (payload) => {
          await createBudget.mutateAsync(payload);
        }}
      />

      <EditBudgetDialog
        open={!!editingBudget}
        onOpenChange={(open) => {
          if (!open) setEditingBudget(null);
        }}
        budget={editingBudget}
        categories={expenseCategories}
        onSubmit={async (payload) => {
          if (!editingBudget) return;
          await updateBudget.mutateAsync({
            budgetId: editingBudget.id,
            payload,
          });
        }}
      />

      <ConfirmDeleteDialog
        open={!!deletingBudget}
        onOpenChange={(open) => {
          if (!open) setDeletingBudget(null);
        }}
        title="Delete budget"
        description={`Are you sure you want to delete "${deletingBudget?.name ?? ""}"?`}
        isLoading={deleteBudget.isPending}
        onConfirm={async () => {
          if (!deletingBudget) return;
          await deleteBudget.mutateAsync(deletingBudget.id);
          setDeletingBudget(null);
        }}
      />
    </>
  );
};

export default FinanceBudgetsTab;
