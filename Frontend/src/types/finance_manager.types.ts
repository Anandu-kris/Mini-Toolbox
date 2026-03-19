export type FinanceTabKey =
  | "overview"
  | "transactions"
  | "accounts"
  | "categories"
  | "budgets";

export type AccountType =
  | "bank"
  | "cash"
  | "wallet"
  | "credit_card"
  | "investment";

export type CategoryType = "income" | "expense";

export type TransactionType = "income" | "expense" | "transfer";

export type BudgetPeriodType = "monthly" | "weekly" | "custom";

export type FinanceId = string;

export type CurrencyType = "INR" | "USD" | "EUR";

export type PaymentMethodType =
  | "cash"
  | "upi"
  | "card"
  | "bank_transfer"
  | "wallet"
  | "other";


export interface FinanceAccount {
  id: string;
  userEmail: string;
  name: string;
  type: AccountType;
  currency: "INR" | "USD" | "EUR";
  openingBalance: number;
  currentBalance: number;
  institution?: string | null;
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceCategory {
  id: string;
  userEmail: string;
  name: string;
  type: CategoryType;
  icon?: string | null;
  color?: string | null;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceTransaction {
  id: string;
  userEmail: string;
  type: TransactionType;
  amount: number;
  currency: "INR" | "USD" | "EUR";
  categoryId?: string | null;
  accountId: string;
  toAccountId?: string | null;
  title: string;
  description?: string | null;
  merchant?: string | null;
  transactionDate: string;
  paymentMethod: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type TransactionFilterState = {
  type: "" | "income" | "expense" | "transfer";
  categoryId: string;
  accountId: string;
  startDate: string;
  endDate: string;
};

export interface FinanceBudget {
  id: string;
  userEmail: string;
  name: string;
  categoryId: string;
  amount: number;
  period: BudgetPeriodType;
  startDate: string;
  endDate?: string | null;
  alertThresholds: number[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceCategorySpendItem {
  categoryId?: string | null;
  categoryName: string;
  amount: number;
}

export interface FinanceMonthlyTrendItem {
  month: string;
  income: number;
  expense: number;
  net: number;
}

export interface FinanceDashboardSummary {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  topExpenseCategories: FinanceCategorySpendItem[];
  monthlyTrend: FinanceMonthlyTrendItem[];
}