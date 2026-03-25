import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import FinanceSectionHeader from "../FinanceSectionHeader";
import TransactionFilters from "./TransactionFilters";
import AddTransactionDialog from "./AddTransactionDialog";
import EditTransactionDialog from "./EditTransactionDialog";
import FinanceEmptyState from "../FinanceEmptyState";
import ConfirmDeleteDialog from "../ConfirmDeleteDialog";
import type { FinanceTransactionItem } from "@/services/finance_manager.service";
import type { TransactionFilterState } from "@/types/finance_manager.types";
import {
  useCreateFinanceTransaction,
  useDeleteFinanceTransaction,
  useFinanceAccounts,
  useFinanceCategories,
  useFinanceTransactions,
  useUpdateFinanceTransaction,
} from "@/hooks/useFinanceManager";
import { OrbitLoader } from "@/components/ui/Loader";

const initialFilters: TransactionFilterState = {
  type: "",
  categoryId: "",
  accountId: "",
  startDate: "",
  endDate: "",
};

const FinanceTransactionsTab = () => {
  const [openAddTransaction, setOpenAddTransaction] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<FinanceTransactionItem | null>(null);
  const [deletingTransaction, setDeletingTransaction] =
    useState<FinanceTransactionItem | null>(null);
  const [filters, setFilters] =
    useState<TransactionFilterState>(initialFilters);

  const { data: accounts = [] } = useFinanceAccounts();
  const { data: categories = [] } = useFinanceCategories();

  const transactionParams = useMemo(() => {
    return {
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(filters.accountId ? { accountId: filters.accountId } : {}),
      ...(filters.startDate
        ? { startDate: new Date(`${filters.startDate}T00:00:00`).toISOString() }
        : {}),
      ...(filters.endDate
        ? { endDate: new Date(`${filters.endDate}T23:59:59`).toISOString() }
        : {}),
    };
  }, [filters]);

  const {
    data: transactions = [],
    isLoading,
    isError,
  } = useFinanceTransactions(transactionParams);

  const createTransaction = useCreateFinanceTransaction();
  const updateTransaction = useUpdateFinanceTransaction();
  const deleteTransaction = useDeleteFinanceTransaction();

  const categoryMap = useMemo(() => {
    return new Map(categories.map((item) => [item.id, item.name]));
  }, [categories]);

  const accountMap = useMemo(() => {
    return new Map(accounts.map((item) => [item.id, item.name]));
  }, [accounts]);

  const handleFiltersChange = (next: TransactionFilterState) => {
    if (next.type === "transfer" && next.categoryId) {
      next = { ...next, categoryId: "" };
    }
    setFilters(next);
  };

  return (
    <>
      <div className="space-y-5">
        <FinanceSectionHeader
          title="Transactions"
          description="View and manage all finance transactions."
          action={
            <Button
              className="text-white bg-linear-to-br rounded-2xl from-purple-600 to-blue-500 hover:bg-linear-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium text-sm px-4 py-2.5 text-center leading-5"
              onClick={() => setOpenAddTransaction(true)}
            >
              <Plus />
              Add Transaction
            </Button>
          }
        />

        <TransactionFilters
          filters={filters}
          onChange={handleFiltersChange}
          accounts={accounts}
          categories={categories}
        />

        {isLoading ? (
          <OrbitLoader />
        ) : isError ? (
          <FinanceEmptyState
            title="Failed to load transactions"
            description="Please try again after a moment."
          />
        ) : transactions.length === 0 ? (
          <FinanceEmptyState
            title="No transactions found"
            description="Try changing filters or add a new transaction."
          />
        ) : (
          <div className="overflow-hidden rounded-3xl border border-border/10 bg-card/5 shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/5 text-left text-accent/70">
                  <tr>
                    <th className="px-4 py-3 font-medium">Title</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Account</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Payment</th>
                    <th className="px-4 py-3 font-medium text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-t border-border/30">
                      <td className="px-4 py-3 font-medium">{tx.title}</td>
                      <td className="px-4 py-3 capitalize">{tx.type}</td>
                      <td className="px-4 py-3">
                        {tx.categoryId
                          ? (categoryMap.get(tx.categoryId) ?? "Unknown")
                          : "-"}
                      </td>
                      <td className="px-4 py-3">
                        {accountMap.get(tx.accountId) ?? "Unknown"}
                      </td>
                      <td className="px-4 py-3">
                        ₹ {tx.amount.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3">
                        {new Date(tx.transactionDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 capitalize">
                        {tx.paymentMethod.replaceAll("_", " ")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setEditingTransaction(tx)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeletingTransaction(tx)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <AddTransactionDialog
        open={openAddTransaction}
        onOpenChange={setOpenAddTransaction}
        accounts={accounts.map((a) => ({
          id: a.id,
          name: a.name,
        }))}
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          type: c.type,
        }))}
        onSubmit={async (payload) => {
          await createTransaction.mutateAsync(payload);
        }}
      />

      <EditTransactionDialog
        open={!!editingTransaction}
        onOpenChange={(open) => {
          if (!open) setEditingTransaction(null);
        }}
        transaction={editingTransaction}
        categories={categories}
        onSubmit={async (payload) => {
          if (!editingTransaction) return;
          await updateTransaction.mutateAsync({
            transactionId: editingTransaction.id,
            payload,
          });
        }}
      />

      <ConfirmDeleteDialog
        open={!!deletingTransaction}
        onOpenChange={(open) => {
          if (!open) setDeletingTransaction(null);
        }}
        title="Delete transaction"
        description={`Are you sure you want to delete "${deletingTransaction?.title ?? ""}"?`}
        isLoading={deleteTransaction.isPending}
        onConfirm={async () => {
          if (!deletingTransaction) return;
          await deleteTransaction.mutateAsync(deletingTransaction.id);
          setDeletingTransaction(null);
        }}
      />
    </>
  );
};

export default FinanceTransactionsTab;
