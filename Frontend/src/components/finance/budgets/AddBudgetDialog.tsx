import { useMemo, useState } from "react";
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

type BudgetPeriodType = "monthly" | "weekly" | "custom";

type ExpenseCategoryOption = {
  id: string;
  name: string;
};

type AddBudgetPayload = {
  name: string;
  categoryId: string;
  amount: number;
  period: BudgetPeriodType;
  startDate: string;
  endDate?: string;
  alertThresholds: number[];
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: ExpenseCategoryOption[];
  onSubmit?: (payload: AddBudgetPayload) => Promise<void> | void;
};

const getTodayDate = () => new Date().toISOString().slice(0, 10);

const initialState: AddBudgetPayload = {
  name: "",
  categoryId: "",
  amount: 0,
  period: "monthly",
  startDate: getTodayDate(),
  endDate: "",
  alertThresholds: [50, 80, 100],
};

const AddBudgetDialog = ({
  open,
  onOpenChange,
  categories,
  onSubmit,
}: Props) => {
  const [form, setForm] = useState<AddBudgetPayload>(initialState);
  const [thresholdText, setThresholdText] = useState("50,80,100");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    return (
      form.name.trim().length > 0 &&
      form.categoryId.length > 0 &&
      Number(form.amount) > 0 &&
      form.startDate.length > 0
    );
  }, [form]);

  const resetForm = () => {
    setForm(initialState);
    setThresholdText("50,80,100");
  };

  const handleClose = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      resetForm();
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    try {
      setIsSubmitting(true);

      const parsedThresholds = thresholdText
        .split(",")
        .map((item) => Number(item.trim()))
        .filter((num) => !Number.isNaN(num));

      await onSubmit?.({
        name: form.name.trim(),
        categoryId: form.categoryId,
        amount: Number(form.amount),
        period: form.period,
        startDate: new Date(form.startDate).toISOString(),
        endDate: form.endDate
          ? new Date(form.endDate).toISOString()
          : undefined,
        alertThresholds:
          parsedThresholds.length > 0 ? parsedThresholds : [50, 80, 100],
      });

      handleClose(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[620px] rounded-3xl border-white/10 bg-[rgba(20,16,40,0.9)] backdrop-blur-3xl text-white">
        <DialogHeader>
          <DialogTitle>Add Budget</DialogTitle>
          <DialogDescription>
            Create a category budget and track usage across your selected period.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-2">
          <div className="grid gap-2">
            <Label htmlFor="budget-name">Budget Name</Label>
            <Input
              id="budget-name"
              placeholder="e.g. Monthly Food Budget"
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
                  <SelectValue placeholder="Select expense category" />
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
              <Label htmlFor="budget-amount">Amount</Label>
              <Input
                id="budget-amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
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
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="budget-start-date">Start Date</Label>
              <Input
                id="budget-start-date"
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, startDate: e.target.value }))
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="budget-end-date">End Date</Label>
              <Input
                id="budget-end-date"
                type="date"
                value={form.endDate}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, endDate: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="budget-thresholds">Alert Thresholds</Label>
            <Input
              id="budget-thresholds"
              placeholder="50,80,100"
              value={thresholdText}
              onChange={(e) => setThresholdText(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Enter alert percentages separated by commas.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button className="bg-linear-to-r from-cyan-600 to-blue-700" onClick={handleSubmit} disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Budget"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddBudgetDialog;