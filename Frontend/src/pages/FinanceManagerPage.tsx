import { useState } from "react";
import FinanceHeader from "@/components/finance/FinanceHeader";
import FinanceTabs from "@/components/finance/FinanceTabs";
import FinanceOverviewTab from "@/components/finance/overview/FinanceOverviewTab";
import FinanceTransactionsTab from "@/components/finance/transactions/FinanceTransactionTab";
import FinanceAccountsTab from "@/components/finance/accounts/FinanceAccountsTab";
import FinanceCategoriesTab from "@/components/finance/categories/FinanceCategoriesTab";
import FinanceBudgetsTab from "@/components/finance/budgets/FinanceBudgetsTab";
import type { FinanceTabKey } from "@/types/finance_manager.types";

const FinanceManagerPage = () => {
  const [activeTab, setActiveTab] = useState<FinanceTabKey>("overview");

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full  flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <FinanceHeader />
        <FinanceTabs activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === "overview" && <FinanceOverviewTab />}
        {activeTab === "transactions" && <FinanceTransactionsTab />}
        {activeTab === "accounts" && <FinanceAccountsTab />}
        {activeTab === "categories" && <FinanceCategoriesTab />}
        {activeTab === "budgets" && <FinanceBudgetsTab />}
      </div>
    </div>
  );
};

export default FinanceManagerPage;