import { api } from "@/lib/api";

import type {
  FinanceId,
  AccountType,
  CurrencyType,
  CategoryType,
  TransactionType,
  PaymentMethodType,
  BudgetPeriodType,
} from "@/types/finance_manager.types";

  //  Accounts

export type FinanceAccountItem = {
  id: FinanceId;
  userId: string;
  name: string;
  type: AccountType;
  currency: CurrencyType;
  openingBalance: number;
  currentBalance: number;
  institution?: string | null;
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FinanceAccountCreatePayload = {
  name: string;
  type: AccountType;
  currency: CurrencyType;
  openingBalance: number;
  institution?: string;
  notes?: string;
};

export type FinanceAccountUpdatePayload = {
  name?: string | null;
  type?: AccountType | null;
  currency?: CurrencyType | null;
  openingBalance?: number | null;
  institution?: string | null;
  notes?: string | null;
  isActive?: boolean | null;
};

  //  Categories

export type FinanceCategoryItem = {
  id: FinanceId;
  userId: string;
  name: string;
  type: CategoryType;
  icon?: string | null;
  color?: string | null;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FinanceCategoryCreatePayload = {
  name: string;
  type: CategoryType;
  icon?: string;
  color?: string;
};

export type FinanceCategoryUpdatePayload = {
  name?: string | null;
  type?: CategoryType | null;
  icon?: string | null;
  color?: string | null;
  isActive?: boolean | null;
};

export type FinanceCategoriesListParams = {
  type?: CategoryType;
};

  //  Transactions

export type FinanceTransactionItem = {
  id: FinanceId;
  userId: string;
  type: TransactionType;
  amount: number;
  currency: CurrencyType;
  categoryId?: FinanceId | null;
  accountId: FinanceId;
  toAccountId?: FinanceId | null;
  title: string;
  description?: string | null;
  merchant?: string | null;
  transactionDate: string;
  paymentMethod: PaymentMethodType;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type FinanceTransactionCreatePayload = {
  type: TransactionType;
  amount: number;
  currency: CurrencyType;
  categoryId?: FinanceId;
  accountId: FinanceId;
  toAccountId?: FinanceId;
  title: string;
  description?: string;
  merchant?: string;
  transactionDate: string;
  paymentMethod: PaymentMethodType;
  tags: string[];
};

export type FinanceTransactionUpdatePayload = {
  amount?: number | null;
  categoryId?: FinanceId | null;
  title?: string | null;
  description?: string | null;
  merchant?: string | null;
  transactionDate?: string | null;
  paymentMethod?: PaymentMethodType | null;
  tags?: string[] | null;
};

export type FinanceTransactionsListParams = {
  startDate?: string;
  endDate?: string;
  type?: TransactionType;
  categoryId?: FinanceId;
  accountId?: FinanceId;
};

  //  Budgets

export type FinanceBudgetItem = {
  id: FinanceId;
  userId: string;
  name: string;
  categoryId: FinanceId;
  amount: number;
  period: BudgetPeriodType;
  startDate: string;
  endDate?: string | null;
  alertThresholds: number[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FinanceBudgetCreatePayload = {
  name: string;
  categoryId: FinanceId;
  amount: number;
  period: BudgetPeriodType;
  startDate: string;
  endDate?: string;
  alertThresholds: number[];
};

export type FinanceBudgetUpdatePayload = {
  name?: string | null;
  categoryId?: FinanceId | null;
  amount?: number | null;
  period?: BudgetPeriodType | null;
  startDate?: string | null;
  endDate?: string | null;
  alertThresholds?: number[] | null;
  isActive?: boolean | null;
};

export type FinanceBudgetStatusItem = {
  budgetId: FinanceId;
  budgetName: string;
  categoryId: FinanceId;
  budgetAmount: number;
  spentAmount: number;
  remainingAmount: number;
  usedPercentage: number;
  isOverBudget: boolean;
};

  //  Dashboard

export type FinanceCategorySpendItem = {
  categoryId?: FinanceId | null;
  categoryName: string;
  amount: number;
};

export type FinanceMonthlyTrendItem = {
  month: string;
  income: number;
  expense: number;
  net: number;
};

export type FinanceDashboardSummary = {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  topExpenseCategories: FinanceCategorySpendItem[];
  monthlyTrend: FinanceMonthlyTrendItem[];
};

export type FinanceDashboardSummaryParams = {
  startDate?: string;
  endDate?: string;
};

  //  Common

export type FinanceMessageResponse = {
  message: string;
};

  //  Service

export const financeManagerService = {
  /* Accounts  */

  createAccount: async (
    payload: FinanceAccountCreatePayload,
  ): Promise<FinanceAccountItem> => {
    const res = await api.post("/api/finance/accounts", payload);
    return res.data;
  },

  listAccounts: async (): Promise<FinanceAccountItem[]> => {
    const res = await api.get("/api/finance/accounts");
    return res.data;
  },

  updateAccount: async (
    accountId: FinanceId,
    payload: FinanceAccountUpdatePayload,
  ): Promise<FinanceAccountItem> => {
    const res = await api.patch(`/api/finance/accounts/${accountId}`, payload);
    return res.data;
  },

  removeAccount: async (
    accountId: FinanceId,
  ): Promise<FinanceMessageResponse> => {
    const res = await api.delete(`/api/finance/accounts/${accountId}`);
    return res.data;
  },

  /* Categories  */

  createCategory: async (
    payload: FinanceCategoryCreatePayload,
  ): Promise<FinanceCategoryItem> => {
    const res = await api.post("/api/finance/categories", payload);
    return res.data;
  },

  listCategories: async (
    params: FinanceCategoriesListParams = {},
  ): Promise<FinanceCategoryItem[]> => {
    const res = await api.get("/api/finance/categories", { params });
    return res.data;
  },

  updateCategory: async (
    categoryId: FinanceId,
    payload: FinanceCategoryUpdatePayload,
  ): Promise<FinanceCategoryItem> => {
    const res = await api.patch(
      `/api/finance/categories/${categoryId}`,
      payload,
    );
    return res.data;
  },

  removeCategory: async (
    categoryId: FinanceId,
  ): Promise<FinanceMessageResponse> => {
    const res = await api.delete(`/api/finance/categories/${categoryId}`);
    return res.data;
  },

  /* Transactions  */

  createTransaction: async (
    payload: FinanceTransactionCreatePayload,
  ): Promise<FinanceTransactionItem> => {
    const res = await api.post("/api/finance/transactions", payload);
    return res.data;
  },

  listTransactions: async (
    params: FinanceTransactionsListParams = {},
  ): Promise<FinanceTransactionItem[]> => {
    const res = await api.get("/api/finance/transactions", { params });
    return res.data;
  },

  updateTransaction: async (
    transactionId: FinanceId,
    payload: FinanceTransactionUpdatePayload,
  ): Promise<FinanceTransactionItem> => {
    const res = await api.patch(
      `/api/finance/transactions/${transactionId}`,
      payload,
    );
    return res.data;
  },

  removeTransaction: async (
    transactionId: FinanceId,
  ): Promise<FinanceMessageResponse> => {
    const res = await api.delete(`/api/finance/transactions/${transactionId}`);
    return res.data;
  },

  /* Budgets */

  createBudget: async (
    payload: FinanceBudgetCreatePayload,
  ): Promise<FinanceBudgetItem> => {
    const res = await api.post("/api/finance/budgets", payload);
    return res.data;
  },

  listBudgets: async (): Promise<FinanceBudgetItem[]> => {
    const res = await api.get("/api/finance/budgets");
    return res.data;
  },

  updateBudget: async (
    budgetId: FinanceId,
    payload: FinanceBudgetUpdatePayload,
  ): Promise<FinanceBudgetItem> => {
    const res = await api.patch(`/api/finance/budgets/${budgetId}`, payload);
    return res.data;
  },

  removeBudget: async (
    budgetId: FinanceId,
  ): Promise<FinanceMessageResponse> => {
    const res = await api.delete(`/api/finance/budgets/${budgetId}`);
    return res.data;
  },

  listBudgetStatus: async (): Promise<FinanceBudgetStatusItem[]> => {
    const res = await api.get("/api/finance/budgets/status");
    return res.data;
  },

  /* Dashboard  */

  getDashboardSummary: async (
    params: FinanceDashboardSummaryParams = {},
  ): Promise<FinanceDashboardSummary> => {
    const res = await api.get("/api/finance/dashboard/summary", { params });
    return res.data;
  },
};
