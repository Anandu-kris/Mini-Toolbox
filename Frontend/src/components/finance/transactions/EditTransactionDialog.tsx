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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  FinanceCategoryItem,
  FinanceTransactionItem,
  FinanceTransactionUpdatePayload,
} from "@/services/finance_manager.service";
import type { PaymentMethodType } from "@/types/finance_manager.types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: FinanceTransactionItem | null;
  categories: FinanceCategoryItem[];
  onSubmit?: (payload: FinanceTransactionUpdatePayload) => Promise<void> | void;
};

const toLocalDateTimeInput = (value?: string) => {
  if (!value) return "";
  const d = new Date(value);
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
};

const EditTransactionDialog = ({
  open,
  onOpenChange,
  transaction,
  categories,
  onSubmit,
}: Props) => {
  const [form, setForm] = useState({
    amount: 0,
    categoryId: "",
    title: "",
    description: "",
    merchant: "",
    transactionDate: "",
    paymentMethod: "other" as PaymentMethodType,
    tagsText: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!transaction) return;
    setForm({
      amount: transaction.amount,

      categoryId: transaction.categoryId ?? "",
      title: transaction.title,
      description: transaction.description ?? "",
      merchant: transaction.merchant ?? "",
      transactionDate: toLocalDateTimeInput(transaction.transactionDate),
      paymentMethod: transaction.paymentMethod,
      tagsText: transaction.tags.join(", "),
    });
  }, [transaction]);

  const filteredCategories = useMemo(() => {
    if (!transaction || transaction.type === "transfer") return [];
    return categories.filter((c) => c.type === transaction.type);
  }, [categories, transaction]);

  const canSubmit = useMemo(() => !!form.title.trim(), [form.title]);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      setIsSubmitting(true);
      await onSubmit?.({
        amount: Number(form.amount),
        categoryId: form.categoryId || null,
        title: form.title.trim(),
        description: form.description.trim() || null,
        merchant: form.merchant.trim() || null,
        transactionDate: form.transactionDate
          ? new Date(form.transactionDate).toISOString()
          : null,
        paymentMethod: form.paymentMethod,
        tags: form.tagsText
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-screen overflow-y-auto sm:max-w-[680px] rounded-3xl border-white/10 bg-[rgba(20,16,40,0.9)] backdrop-blur-3xl text-white">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
          <DialogDescription>Update this transaction.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-2">
          {transaction?.type !== "transfer" ? (
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select
                value={form.categoryId}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, categoryId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, title: e.target.value }))
                }
              />
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Merchant</Label>
              <Input
                value={form.merchant}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, merchant: e.target.value }))
                }
              />
            </div>

            <div className="grid gap-2">
              <Label>Transaction Date</Label>
              <Input
                type="datetime-local"
                value={form.transactionDate}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    transactionDate: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Payment Method</Label>
            <Select
              value={form.paymentMethod}
              onValueChange={(value: PaymentMethodType) =>
                setForm((prev) => ({ ...prev, paymentMethod: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="wallet">Wallet</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Tags</Label>
            <Input
              value={form.tagsText}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, tagsText: e.target.value }))
              }
            />
          </div>

          <div className="grid gap-2">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              className="min-h-[110px] resize-none"
            />
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

export default EditTransactionDialog;
