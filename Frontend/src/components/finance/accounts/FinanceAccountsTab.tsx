import { useState } from "react";
import { Button } from "@/components/ui/button";
import FinanceSectionHeader from "../FinanceSectionHeader";
import AddAccountDialog from "./AddAccountDialog";
import EditAccountDialog from "./EditAccountDialog";
import AccountCard from "./AccountCard";
import FinanceEmptyState from "../FinanceEmptyState";
import ConfirmDeleteDialog from "../ConfirmDeleteDialog";
import type { FinanceAccountItem } from "@/services/finance_manager.service";
import {
  useCreateFinanceAccount,
  useDeleteFinanceAccount,
  useFinanceAccounts,
  useUpdateFinanceAccount,
} from "@/hooks/useFinanceManager";
import { OrbitLoader } from "@/components/ui/Loader";
import { Plus } from "lucide-react";

const FinanceAccountsTab = () => {
  const [openAddAccount, setOpenAddAccount] = useState(false);
  const [editingAccount, setEditingAccount] =
    useState<FinanceAccountItem | null>(null);
  const [deletingAccount, setDeletingAccount] =
    useState<FinanceAccountItem | null>(null);

  const { data: accounts = [], isLoading, isError } = useFinanceAccounts();
  const createAccount = useCreateFinanceAccount();
  const updateAccount = useUpdateFinanceAccount();
  const deleteAccount = useDeleteFinanceAccount();

  console.log("accounts raw", accounts);

  return (
    <>
      <div className="space-y-5">
        <FinanceSectionHeader
          title="Accounts"
          description="Manage wallets, bank accounts, and credit cards."
          action={
            <Button
              className="text-white rounded-2xl bg-linear-to-br  from-purple-600 to-blue-500 hover:bg-linear-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium text-sm px-4 py-2.5 text-center leading-5"
              onClick={() => setOpenAddAccount(true)}
            >
              <Plus />
              Add Account
            </Button>
          }
        />

        {isLoading ? (
          <OrbitLoader />
        ) : isError ? (
          <FinanceEmptyState
            title="Failed to load accounts"
            description="Please try again after a moment."
          />
        ) : accounts.length === 0 ? (
          <FinanceEmptyState
            title="No accounts yet"
            description="Create your first finance account to start tracking balances and transactions."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {accounts.map((account) => (
              <AccountCard
                key={account.id}
                name={account.name}
                type={account.type}
                balance={`₹ ${account.currentBalance.toLocaleString("en-IN")}`}
                institution={account.institution ?? undefined}
                onEdit={() => setEditingAccount(account)}
                onDelete={() => setDeletingAccount(account)}
              />
            ))}
          </div>
        )}
      </div>

      <AddAccountDialog
        open={openAddAccount}
        onOpenChange={setOpenAddAccount}
        onSubmit={async (payload) => {
          await createAccount.mutateAsync(payload);
        }}
      />

      <EditAccountDialog
        open={!!editingAccount}
        onOpenChange={(open) => {
          if (!open) setEditingAccount(null);
        }}
        account={editingAccount}
        onSubmit={async (payload) => {
          if (!editingAccount) return;
          await updateAccount.mutateAsync({
            accountId: editingAccount.id,
            payload,
          });
        }}
      />

      <ConfirmDeleteDialog
        open={!!deletingAccount}
        onOpenChange={(open) => {
          if (!open) setDeletingAccount(null);
        }}
        title="Delete account"
        description={`Are you sure you want to delete "${deletingAccount?.name ?? ""}"?`}
        isLoading={deleteAccount.isPending}
        onConfirm={async () => {
          if (!deletingAccount) return;
          await deleteAccount.mutateAsync(deletingAccount.id);
          setDeletingAccount(null);
        }}
      />
    </>
  );
};

export default FinanceAccountsTab;
