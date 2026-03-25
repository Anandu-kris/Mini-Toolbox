import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  FinanceAccountItem,
  FinanceCategoryItem,
} from "@/services/finance_manager.service";
import type { TransactionFilterState } from "@/types/finance_manager.types";

type Props = {
  filters: TransactionFilterState;
  onChange: (next: TransactionFilterState) => void;
  accounts: FinanceAccountItem[];
  categories: FinanceCategoryItem[];
};

const TransactionFilters = ({
  filters,
  onChange,
  accounts,
  categories,
}: Props) => {
  const setField = <K extends keyof TransactionFilterState>(
    key: K,
    value: TransactionFilterState[K],
  ) => {
    onChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilters = () => {
    onChange({
      type: "",
      categoryId: "",
      accountId: "",
      startDate: "",
      endDate: "",
    });
  };

  const filteredCategories =
    filters.type && filters.type !== "transfer"
      ? categories.filter((c) => c.type === filters.type)
      : categories;

  return (
    <div className="rounded-3xl border border-border/20 bg-card/5 p-4 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="grid gap-2">
          <Label>Type</Label>
          <Select
            value={filters.type || "all"}
            onValueChange={(value) =>
              setField("type", value === "all" ? "" : (value as TransactionFilterState["type"]))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
              <SelectItem value="transfer">Transfer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label>Category</Label>
          <Select
            value={filters.categoryId || "all"}
            onValueChange={(value) =>
              setField("categoryId", value === "all" ? "" : value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {filteredCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label>Account</Label>
          <Select
            value={filters.accountId || "all"}
            onValueChange={(value) =>
              setField("accountId", value === "all" ? "" : value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All accounts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All accounts</SelectItem>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label>Start Date</Label>
          <Input
            type="date"
            value={filters.startDate}
            onChange={(e) => setField("startDate", e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label>End Date</Label>
          <Input
            type="date"
            value={filters.endDate}
            onChange={(e) => setField("endDate", e.target.value)}
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button variant="outline" onClick={clearFilters}>
          <X className="mr-2 h-4 w-4" />
          Clear Filters
        </Button>
      </div>
    </div>
  );
};

export default TransactionFilters;