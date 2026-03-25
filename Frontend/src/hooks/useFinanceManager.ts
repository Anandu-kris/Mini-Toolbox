import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { toast } from "sonner";
import {
  financeManagerService,
  type FinanceAccountCreatePayload,
  type FinanceAccountItem,
  type FinanceAccountUpdatePayload,
  type FinanceBudgetCreatePayload,
  type FinanceBudgetItem,
  type FinanceBudgetStatusItem,
  type FinanceBudgetUpdatePayload,
  type FinanceCategoriesListParams,
  type FinanceCategoryCreatePayload,
  type FinanceCategoryItem,
  type FinanceCategoryUpdatePayload,
  type FinanceDashboardSummary,
  type FinanceDashboardSummaryParams,
  type FinanceMessageResponse,
  type FinanceTransactionCreatePayload,
  type FinanceTransactionItem,
  type FinanceTransactionUpdatePayload,
  type FinanceTransactionsListParams,
} from "@/services/finance_manager.service";
import { type FinanceId } from "@/types/finance_manager.types";

type ApiErrorBody = {
  detail?: string;
  message?: string;
};

const getErrorMessage = (
  error: AxiosError<ApiErrorBody>,
  fallback: string,
) => {
  return (
    error.response?.data?.detail ||
    error.response?.data?.message ||
    error.message ||
    fallback
  );
};

export const financeKeys = {
  all: ["finance"] as const,

  accountsAll: ["finance", "accounts"] as const,
  accountsList: () => ["finance", "accounts", "list"] as const,
  accountById: (id: FinanceId) => ["finance", "accounts", "byId", id] as const,

  categoriesAll: ["finance", "categories"] as const,
  categoriesList: (params: FinanceCategoriesListParams) =>
    ["finance", "categories", "list", params] as const,
  categoryById: (id: FinanceId) =>
    ["finance", "categories", "byId", id] as const,

  transactionsAll: ["finance", "transactions"] as const,
  transactionsList: (params: FinanceTransactionsListParams) =>
    ["finance", "transactions", "list", params] as const,
  transactionById: (id: FinanceId) =>
    ["finance", "transactions", "byId", id] as const,

  budgetsAll: ["finance", "budgets"] as const,
  budgetsList: () => ["finance", "budgets", "list"] as const,
  budgetById: (id: FinanceId) => ["finance", "budgets", "byId", id] as const,
  budgetStatus: () => ["finance", "budgets", "status"] as const,

  dashboardAll: ["finance", "dashboard"] as const,
  dashboardSummary: (params: FinanceDashboardSummaryParams) =>
    ["finance", "dashboard", "summary", params] as const,
};

  //  Accounts

export function useFinanceAccounts(enabled = true) {
  return useQuery<FinanceAccountItem[], AxiosError<ApiErrorBody>>({
    queryKey: financeKeys.accountsList(),
    queryFn: () => financeManagerService.listAccounts(),
    enabled,
    staleTime: 60_000,
  });
}

export function useCreateFinanceAccount() {
  const qc = useQueryClient();

  return useMutation<
    FinanceAccountItem,
    AxiosError<ApiErrorBody>,
    FinanceAccountCreatePayload
  >({
    mutationFn: financeManagerService.createAccount,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: financeKeys.accountsAll });
      qc.invalidateQueries({ queryKey: financeKeys.dashboardAll });
      toast.success("Account created successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to create account"));
    },
  });
}

export function useUpdateFinanceAccount() {
  const qc = useQueryClient();

  return useMutation<
    FinanceAccountItem,
    AxiosError<ApiErrorBody>,
    { accountId: FinanceId; payload: FinanceAccountUpdatePayload }
  >({
    mutationFn: ({ accountId, payload }) =>
      financeManagerService.updateAccount(accountId, payload),
    onSuccess: (updated) => {
      qc.setQueryData(financeKeys.accountById(updated.id), updated);
      qc.invalidateQueries({ queryKey: financeKeys.accountsAll });
      qc.invalidateQueries({ queryKey: financeKeys.dashboardAll });
      toast.success("Account updated successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to update account"));
    },
  });
}

export function useDeleteFinanceAccount() {
  const qc = useQueryClient();

  return useMutation<
    FinanceMessageResponse,
    AxiosError<ApiErrorBody>,
    FinanceId
  >({
    mutationFn: (accountId) => financeManagerService.removeAccount(accountId),
    onSuccess: (_res, accountId) => {
      qc.removeQueries({ queryKey: financeKeys.accountById(accountId) });
      qc.invalidateQueries({ queryKey: financeKeys.accountsAll });
      qc.invalidateQueries({ queryKey: financeKeys.dashboardAll });
      toast.success("Account deleted successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to delete account"));
    },
  });
}

  //  Categories

export function useFinanceCategories(
  params: FinanceCategoriesListParams = {},
  enabled = true,
) {
  return useQuery<FinanceCategoryItem[], AxiosError<ApiErrorBody>>({
    queryKey: financeKeys.categoriesList(params),
    queryFn: () => financeManagerService.listCategories(params),
    enabled,
    staleTime: 60_000,
  });
}

export function useCreateFinanceCategory() {
  const qc = useQueryClient();

  return useMutation<
    FinanceCategoryItem,
    AxiosError<ApiErrorBody>,
    FinanceCategoryCreatePayload
  >({
    mutationFn: financeManagerService.createCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: financeKeys.categoriesAll });
      toast.success("Category created successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to create category"));
    },
  });
}

export function useUpdateFinanceCategory() {
  const qc = useQueryClient();

  return useMutation<
    FinanceCategoryItem,
    AxiosError<ApiErrorBody>,
    { categoryId: FinanceId; payload: FinanceCategoryUpdatePayload }
  >({
    mutationFn: ({ categoryId, payload }) =>
      financeManagerService.updateCategory(categoryId, payload),
    onSuccess: (updated) => {
      qc.setQueryData(financeKeys.categoryById(updated.id), updated);
      qc.invalidateQueries({ queryKey: financeKeys.categoriesAll });
      toast.success("Category updated successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to update category"));
    },
  });
}

export function useDeleteFinanceCategory() {
  const qc = useQueryClient();

  return useMutation<
    FinanceMessageResponse,
    AxiosError<ApiErrorBody>,
    FinanceId
  >({
    mutationFn: (categoryId) =>
      financeManagerService.removeCategory(categoryId),
    onSuccess: (_res, categoryId) => {
      qc.removeQueries({ queryKey: financeKeys.categoryById(categoryId) });
      qc.invalidateQueries({ queryKey: financeKeys.categoriesAll });
      qc.invalidateQueries({ queryKey: financeKeys.transactionsAll });
      qc.invalidateQueries({ queryKey: financeKeys.budgetsAll });
      qc.invalidateQueries({ queryKey: financeKeys.dashboardAll });
      toast.success("Category deleted successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to delete category"));
    },
  });
}

  //  Transactions

export function useFinanceTransactions(
  params: FinanceTransactionsListParams = {},
  enabled = true,
) {
  return useQuery<FinanceTransactionItem[], AxiosError<ApiErrorBody>>({
    queryKey: financeKeys.transactionsList(params),
    queryFn: () => financeManagerService.listTransactions(params),
    enabled,
    staleTime: 60_000,
  });
}

export function useCreateFinanceTransaction() {
  const qc = useQueryClient();

  return useMutation<
    FinanceTransactionItem,
    AxiosError<ApiErrorBody>,
    FinanceTransactionCreatePayload
  >({
    mutationFn: financeManagerService.createTransaction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: financeKeys.transactionsAll });
      qc.invalidateQueries({ queryKey: financeKeys.accountsAll });
      qc.invalidateQueries({ queryKey: financeKeys.budgetsAll });
      qc.invalidateQueries({ queryKey: financeKeys.dashboardAll });
      toast.success("Transaction added successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to create transaction"));
    },
  });
}

export function useUpdateFinanceTransaction() {
  const qc = useQueryClient();

  return useMutation<
    FinanceTransactionItem,
    AxiosError<ApiErrorBody>,
    { transactionId: FinanceId; payload: FinanceTransactionUpdatePayload }
  >({
    mutationFn: ({ transactionId, payload }) =>
      financeManagerService.updateTransaction(transactionId, payload),
    onSuccess: (updated) => {
      qc.setQueryData(financeKeys.transactionById(updated.id), updated);
      qc.invalidateQueries({ queryKey: financeKeys.transactionsAll });
      qc.invalidateQueries({ queryKey: financeKeys.accountsAll });
      qc.invalidateQueries({ queryKey: financeKeys.budgetsAll });
      qc.invalidateQueries({ queryKey: financeKeys.dashboardAll });
      toast.success("Transaction updated successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to update transaction"));
    },
  });
}

export function useDeleteFinanceTransaction() {
  const qc = useQueryClient();

  return useMutation<
    FinanceMessageResponse,
    AxiosError<ApiErrorBody>,
    FinanceId
  >({
    mutationFn: (transactionId) =>
      financeManagerService.removeTransaction(transactionId),
    onSuccess: (_res, transactionId) => {
      qc.removeQueries({
        queryKey: financeKeys.transactionById(transactionId),
      });
      qc.invalidateQueries({ queryKey: financeKeys.transactionsAll });
      qc.invalidateQueries({ queryKey: financeKeys.accountsAll });
      qc.invalidateQueries({ queryKey: financeKeys.budgetsAll });
      qc.invalidateQueries({ queryKey: financeKeys.dashboardAll });
      toast.success("Transaction deleted successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to delete transaction"));
    },
  });
}

  //  Budgets

export function useFinanceBudgets(enabled = true) {
  return useQuery<FinanceBudgetItem[], AxiosError<ApiErrorBody>>({
    queryKey: financeKeys.budgetsList(),
    queryFn: () => financeManagerService.listBudgets(),
    enabled,
    staleTime: 60_000,
  });
}

export function useFinanceBudgetStatus(enabled = true) {
  return useQuery<FinanceBudgetStatusItem[], AxiosError<ApiErrorBody>>({
    queryKey: financeKeys.budgetStatus(),
    queryFn: () => financeManagerService.listBudgetStatus(),
    enabled,
    staleTime: 60_000,
  });
}

export function useCreateFinanceBudget() {
  const qc = useQueryClient();

  return useMutation<
    FinanceBudgetItem,
    AxiosError<ApiErrorBody>,
    FinanceBudgetCreatePayload
  >({
    mutationFn: financeManagerService.createBudget,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: financeKeys.budgetsAll });
      qc.invalidateQueries({ queryKey: financeKeys.dashboardAll });
      toast.success("Budget created successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to create budget"));
    },
  });
}

export function useUpdateFinanceBudget() {
  const qc = useQueryClient();

  return useMutation<
    FinanceBudgetItem,
    AxiosError<ApiErrorBody>,
    { budgetId: FinanceId; payload: FinanceBudgetUpdatePayload }
  >({
    mutationFn: ({ budgetId, payload }) =>
      financeManagerService.updateBudget(budgetId, payload),
    onSuccess: (updated) => {
      qc.setQueryData(financeKeys.budgetById(updated.id), updated);
      qc.invalidateQueries({ queryKey: financeKeys.budgetsAll });
      qc.invalidateQueries({ queryKey: financeKeys.dashboardAll });
      toast.success("Budget updated successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to update budget"));
    },
  });
}

export function useDeleteFinanceBudget() {
  const qc = useQueryClient();

  return useMutation<
    FinanceMessageResponse,
    AxiosError<ApiErrorBody>,
    FinanceId
  >({
    mutationFn: (budgetId) => financeManagerService.removeBudget(budgetId),
    onSuccess: (_res, budgetId) => {
      qc.removeQueries({ queryKey: financeKeys.budgetById(budgetId) });
      qc.invalidateQueries({ queryKey: financeKeys.budgetsAll });
      qc.invalidateQueries({ queryKey: financeKeys.dashboardAll });
      toast.success("Budget deleted successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to delete budget"));
    },
  });
}

  //  Dashboard

export function useFinanceDashboardSummary(
  params: FinanceDashboardSummaryParams = {},
  enabled = true,
) {
  return useQuery<FinanceDashboardSummary, AxiosError<ApiErrorBody>>({
    queryKey: financeKeys.dashboardSummary(params),
    queryFn: () => financeManagerService.getDashboardSummary(params),
    enabled,
    staleTime: 60_000,
  });
}