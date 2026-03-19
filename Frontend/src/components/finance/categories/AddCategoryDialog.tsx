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

type CategoryType = "income" | "expense";

type AddCategoryPayload = {
  name: string;
  type: CategoryType;
  icon?: string;
  color?: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (payload: AddCategoryPayload) => Promise<void> | void;
};

const initialState: AddCategoryPayload = {
  name: "",
  type: "expense",
  icon: "",
  color: "#6366F1",
};

const AddCategoryDialog = ({ open, onOpenChange, onSubmit }: Props) => {
  const [form, setForm] = useState<AddCategoryPayload>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(() => form.name.trim().length > 0, [form.name]);

  const resetForm = () => setForm(initialState);

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
      await onSubmit?.({
        name: form.name.trim(),
        type: form.type,
        icon: form.icon?.trim() || "",
        color: form.color || "#6366F1",
      });
      handleClose(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[520px] rounded-3xl border-white/10 bg-[rgba(20,16,40,0.9)] backdrop-blur-3xl text-white">
        <DialogHeader>
          <DialogTitle>Add Category</DialogTitle>
          <DialogDescription>
            Create a custom income or expense category for your transactions.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-2">
          <div className="grid gap-2">
            <Label htmlFor="category-name">Category Name</Label>
            <Input
              id="category-name"
              placeholder="e.g. Food, Salary, Bills"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Category Type</Label>
              <Select
                value={form.type}
                onValueChange={(value: CategoryType) =>
                  setForm((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category-color">Color</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="category-color"
                  type="color"
                  value={form.color}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, color: e.target.value }))
                  }
                  className="h-11 w-16 p-1"
                />
                <Input
                  value={form.color}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, color: e.target.value }))
                  }
                  placeholder="#6366F1"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Select
              value={form.icon}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, icon: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select icon" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entertainment">Entertainments</SelectItem>
                <SelectItem value="subscription">Subscriptions</SelectItem>
                <SelectItem value="wallet">Wallet</SelectItem>
                <SelectItem value="coffee">Coffee</SelectItem>
                <SelectItem value="receipt">Receipt</SelectItem>
                <SelectItem value="food">Food</SelectItem>
                <SelectItem value="shopping">Shopping</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button
            className="bg-linear-to-r from-cyan-600 to-blue-700"
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create Category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddCategoryDialog;
