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
  FinanceCategoryItem,
  FinanceCategoryUpdatePayload,
} from "@/services/finance_manager.service";
import type { CategoryType } from "@/types/finance_manager.types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: FinanceCategoryItem | null;
  onSubmit?: (payload: FinanceCategoryUpdatePayload) => Promise<void> | void;
};

const EditCategoryDialog = ({
  open,
  onOpenChange,
  category,
  onSubmit,
}: Props) => {
  const [form, setForm] = useState<FinanceCategoryUpdatePayload>({
    name: "",
    type: "expense",
    icon: "",
    color: "#6366F1",
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!category) return;
    setForm({
      name: category.name,
      type: category.type,
      icon: category.icon ?? "",
      color: category.color ?? "#6366F1",
      isActive: category.isActive,
    });
  }, [category]);

  const canSubmit = useMemo(() => !!form.name?.trim(), [form.name]);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      setIsSubmitting(true);
      await onSubmit?.({
        ...form,
        name: form.name?.trim() || "",
        icon: form.icon?.trim() || "",
        color: form.color || "#6366F1",
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] rounded-3xl border-white/10 bg-[rgba(20,16,40,0.9)] backdrop-blur-3xl text-white">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
          <DialogDescription>Update this category.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-2">
          <div className="grid gap-2">
            <Label>Category Name</Label>
            <Input
              value={form.name ?? ""}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Category Type</Label>
              <Select
                value={(form.type as CategoryType) ?? "expense"}
                onValueChange={(value: CategoryType) =>
                  setForm((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Color</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="color"
                  value={form.color ?? "#6366F1"}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, color: e.target.value }))
                  }
                  className="h-11 w-16 p-1"
                />
                <Input
                  value={form.color ?? "#6366F1"}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, color: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Select
              value={form.icon ?? "none"}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  icon: value === "none" ? "" : value,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select icon" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entertainment">Entertainment</SelectItem>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-linear-to-r from-cyan-600 to-blue-700"
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditCategoryDialog;
