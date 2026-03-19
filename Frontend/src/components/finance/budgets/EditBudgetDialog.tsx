import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  FinanceBudgetItem,
  FinanceBudgetUpdatePayload,
} from "@/services/finance_manager.service";
import type { BudgetPeriodType } from "@/types/finance_manager.types";

type ExpenseCategoryOption = {
  id: string;
  name: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget: FinanceBudgetItem | null;
  categories: ExpenseCategoryOption[];
  onSubmit?: (payload: FinanceBudgetUpdatePayload) => Promise<void> | void;
};

const toDateInput = (value?: string | null) =>
  value ? new Date(value).toISOString().slice(0, 10) : "";

const EditBudgetDialog = ({
  open,
  onOpenChange,
  budget,
  categories,
  onSubmit,
}: Props) => {
  const [form, setForm] = useState({
    name: "",
    categoryId: "",
    amount: 0,
    period: "monthly" as BudgetPeriodType,
    startDate: "",
    endDate: "",
    thresholdText: "50,80,100",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!budget) return;
    setForm({
      name: budget.name,
      categoryId: budget.categoryId,
      amount: budget.amount,
      period: budget.period,
      startDate: toDateInput(budget.startDate),
      endDate: toDateInput(budget.endDate),
      thresholdText: budget.alertThresholds.join(","),
    });
  }, [budget]);

  const canSubmit = useMemo(() => {
    return !!form.name.trim() && !!form.categoryId && Number(form.amount) > 0;
  }, [form]);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      setIsSubmitting(true);
      const parsedThresholds = form.thresholdText
        .split(",")
        .map((item) => Number(item.trim()))
        .filter((num) => !Number.isNaN(num));

      await onSubmit?.({
        name: form.name.trim(),
        categoryId: form.categoryId,
        amount: Number(form.amount),
        period: form.period,
        startDate: form.startDate
          ? new Date(form.startDate).toISOString()
          : null,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
        alertThresholds: parsedThresholds,
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] rounded-3xl border-white/10 bg-[rgba(20,16,40,0.9)] backdrop-blur-3xl text-white">
        <DialogHeader>
          <DialogTitle>Edit Budget</DialogTitle>
          <DialogDescription>Update this budget.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-2">
          <div className="grid gap-2">
            <Label>Budget Name</Label>
            <Input
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2 sm:col-span-2">
              <Label>Expense Category</Label>
              <Select
                value={form.categoryId}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, categoryId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Amount</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    amount: Number(e.target.value),
                  }))
                }
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label>Period</Label>
              <Select
                value={form.period}
                onValueChange={(value: BudgetPeriodType) =>
                  setForm((prev) => ({ ...prev, period: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, startDate: e.target.value }))
                }
              />
            </div>

            <div className="grid gap-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, endDate: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Alert Thresholds</Label>
            <Input
              value={form.thresholdText}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, thresholdText: e.target.value }))
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="bg-linear-to-r from-cyan-600 to-blue-700" onClick={handleSubmit} disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditBudgetDialog;
