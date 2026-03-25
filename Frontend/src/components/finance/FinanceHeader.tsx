import { Landmark, Plus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import AddAccountDialog from "./accounts/AddAccountDialog";
import AddTransactionDialog from "./transactions/AddTransactionDialog";
import { useState } from "react";
import {
  useCreateFinanceAccount,
  useCreateFinanceTransaction,
  useFinanceAccounts,
  useFinanceCategories,
} from "@/hooks/useFinanceManager";
import { toast } from "sonner";

const FinanceHeader = () => {
  const [openAddAccount, setOpenAddAccount] = useState(false);
  const [openAddTransaction, setOpenAddTransaction] = useState(false);

  const { data: accounts = [] } = useFinanceAccounts();
  const { data: categories = [] } = useFinanceCategories();

  const createAccount = useCreateFinanceAccount();
  const createTransaction = useCreateFinanceTransaction();

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/3 backdrop-blur-xl shadow-[0_24px_64px_rgba(0,0,0,0.28)]">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px]"
          style={{
            background:
              "linear-gradient(to right, transparent, rgba(139, 92, 246,0.6) 30%, rgba(34,211,238,0.5) 70%, transparent)",
          }}
        />

        <div
          className="pointer-events-none absolute -left-16 -top-16 h-72 w-72 rounded-full opacity-[0.12]"
          style={{ background: "#8b5cf6", filter: "blur(56px)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-20 right-0 h-64 w-64 rounded-full opacity-[0.08]"
          style={{ background: "#06b6d4", filter: "blur(56px)" }}
        />

        <div
          className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1 text-[12px] font-semibold uppercase tracking-widest text-cyan-500">
              <Wallet className="h-4 w-4" />
              Personal Finance
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-[1.75rem]">
                Track expenses,{" "}
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage:
                      "linear-gradient(90deg, #8b5cf6 0%, #22d3ee 100%)",
                  }}
                >
                  budgets & cash flow
                </span>
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400">
                Manage accounts, categorize spending, monitor budgets — the
                foundation for your AI Finance Copilot.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {[
                { label: "Accounts", value: accounts.length },
                { label: "Categories", value: categories.length },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 rounded-full border border-white/8 bg-white/4 px-3 py-1 text-xs text-zinc-400"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span className="font-medium text-white">{value}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div
              className="
                  inline-flex rounded-2xl
                  bg-neutral-primary border-2 border-blue-500 transition-all duration-300
                  hover:shadow-[0_0_20px_rgba(59,130,246,0.35)]"
            >
              <Button
                onClick={() => setOpenAddAccount(true)}
                className="
                    rounded-[calc(1rem-2px)] bg-transparent text-white border-0 shadow-none hover:bg-linear-to-r hover:from-cyan-500 hover:to-blue-500
                    hover:text-white transition-all duration-300"
              >
                <Landmark className="mr-2 h-4 w-4" />
                Add Account
              </Button>
            </div>

            <Button
              title={accounts.length === 0 ? "Create an account first" : ""}
              className="text-white rounded-2xl bg-linear-to-br  from-purple-500 to-blue-500 hover:bg-linear-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium text-sm px-4 py-2.5 text-center leading-5"
              onClick={() => {
                if (accounts.length === 0) {
                  toast.warning("Create an account first!");
                  return;
                }
                setOpenAddTransaction(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Transaction
            </Button>
          </div>
        </div>

        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px opacity-20"
          style={{
            background:
              "linear-gradient(to right, transparent, rgba(255,255,255,0.4), transparent)",
          }}
        />
      </div>

      <AddAccountDialog
        open={openAddAccount}
        onOpenChange={setOpenAddAccount}
        onSubmit={async (payload) => {
          await createAccount.mutateAsync(payload);
        }}
      />

      <AddTransactionDialog
        open={openAddTransaction}
        onOpenChange={setOpenAddTransaction}
        accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          type: c.type,
        }))}
        onSubmit={async (payload) => {
          await createTransaction.mutateAsync(payload);
        }}
      />
    </>
  );
};

export default FinanceHeader;
