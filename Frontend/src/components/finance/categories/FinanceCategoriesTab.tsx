import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import FinanceSectionHeader from "../FinanceSectionHeader";
import AddCategoryDialog from "./AddCategoryDialog";
import EditCategoryDialog from "./EditCategoryDialog";
import CategoryCard from "./CategoryCard";
import FinanceEmptyState from "../FinanceEmptyState";
import ConfirmDeleteDialog from "../ConfirmDeleteDialog";
import type { FinanceCategoryItem } from "@/services/finance_manager.service";
import {
  useCreateFinanceCategory,
  useDeleteFinanceCategory,
  useFinanceCategories,
  useUpdateFinanceCategory,
} from "@/hooks/useFinanceManager";
import { OrbitLoader } from "@/components/ui/Loader";
import { Plus } from "lucide-react";

const FinanceCategoriesTab = () => {
  const [openAddCategory, setOpenAddCategory] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<FinanceCategoryItem | null>(null);
  const [deletingCategory, setDeletingCategory] =
    useState<FinanceCategoryItem | null>(null);

  const { data: categories = [], isLoading, isError } = useFinanceCategories();
  const createCategory = useCreateFinanceCategory();
  const updateCategory = useUpdateFinanceCategory();
  const deleteCategory = useDeleteFinanceCategory();

  const incomeCategories = useMemo(
    () => categories.filter((item) => item.type === "income"),
    [categories],
  );

  const expenseCategories = useMemo(
    () => categories.filter((item) => item.type === "expense"),
    [categories],
  );

  return (
    <>
      <div className="space-y-5">
        <FinanceSectionHeader
          title="Categories"
          description="Organize your income and expense categories."
          action={
            <Button
              className="text-white rounded-2xl bg-linear-to-br  from-purple-600 to-blue-500 hover:bg-linear-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium text-sm px-4 py-2.5 text-center leading-5"
              onClick={() => setOpenAddCategory(true)}
            >
              <Plus />
              Add Category
            </Button>
          }
        />

        {isLoading ? (
          <OrbitLoader />
        ) : isError ? (
          <FinanceEmptyState
            title="Failed to load categories"
            description="Please try again after a moment."
          />
        ) : categories.length === 0 ? (
          <FinanceEmptyState
            title="No categories yet"
            description="Create income and expense categories before adding transactions."
          />
        ) : (
          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-3xl border border-border/10 bg-card/5 p-5 shadow-sm">
              <h3 className="text-base font-semibold">Income Categories</h3>
              <div className="mt-4 grid gap-3">
                {incomeCategories.length ? (
                  incomeCategories.map((item) => (
                    <CategoryCard
                      key={item.id}
                      name={item.name}
                      type="income"
                      icon={item.icon ?? undefined}
                      color={item.color ?? undefined}
                      onEdit={() => setEditingCategory(item)}
                      onDelete={() => setDeletingCategory(item)}
                    />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No income categories yet.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-border/10 bg-card/5 p-5 shadow-sm">
              <h3 className="text-base font-semibold">Expense Categories</h3>
              <div className="mt-4 grid gap-3">
                {expenseCategories.length ? (
                  expenseCategories.map((item) => (
                    <CategoryCard
                      key={item.id}
                      name={item.name}
                      type="expense"
                      icon={item.icon ?? undefined}
                      color={item.color ?? undefined}
                      onEdit={() => setEditingCategory(item)}
                      onDelete={() => setDeletingCategory(item)}
                    />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No expense categories yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <AddCategoryDialog
        open={openAddCategory}
        onOpenChange={setOpenAddCategory}
        onSubmit={async (payload) => {
          await createCategory.mutateAsync(payload);
        }}
      />

      <EditCategoryDialog
        open={!!editingCategory}
        onOpenChange={(open) => {
          if (!open) setEditingCategory(null);
        }}
        category={editingCategory}
        onSubmit={async (payload) => {
          if (!editingCategory) return;
          await updateCategory.mutateAsync({
            categoryId: editingCategory.id,
            payload,
          });
        }}
      />

      <ConfirmDeleteDialog
        open={!!deletingCategory}
        onOpenChange={(open) => {
          if (!open) setDeletingCategory(null);
        }}
        title="Delete category"
        description={`Are you sure you want to delete "${deletingCategory?.name ?? ""}"?`}
        isLoading={deleteCategory.isPending}
        onConfirm={async () => {
          if (!deletingCategory) return;
          await deleteCategory.mutateAsync(deletingCategory.id);
          setDeletingCategory(null);
        }}
      />
    </>
  );
};

export default FinanceCategoriesTab;
