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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TransactionType = "income" | "expense" | "transfer";
type CurrencyType = "INR" | "USD" | "EUR";
type PaymentMethodType =
  | "cash"
  | "upi"
  | "card"
  | "bank_transfer"
  | "wallet"
  | "other";

type FinanceAccountOption = {
  id: string;
  name: string;
};

type FinanceCategoryOption = {
  id: string;
  name: string;
  type: "income" | "expense";
};

type AddTransactionPayload = {
  type: TransactionType;
  amount: number;
  currency: CurrencyType;
  categoryId?: string;
  accountId: string;
  toAccountId?: string;
  title: string;
  description?: string;
  merchant?: string;
  transactionDate: string;
  paymentMethod: PaymentMethodType;
  tags: string[];
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: FinanceAccountOption[];
  categories: FinanceCategoryOption[];
  onSubmit?: (payload: AddTransactionPayload) => Promise<void> | void;
};

const getTodayLocalDateTime = () => {
  const now = new Date();
  const tzOffset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
};

const initialState: AddTransactionPayload = {
  type: "expense",
  amount: 0,
  currency: "INR",
  categoryId: "",
  accountId: "",
  toAccountId: "",
  title: "",
  description: "",
  merchant: "",
  transactionDate: getTodayLocalDateTime(),
  paymentMethod: "upi",
  tags: [],
};

const AddTransactionDialog = ({
  open,
  onOpenChange,
  accounts,
  categories,
  onSubmit,
}: Props) => {
  const [form, setForm] = useState<AddTransactionPayload>(initialState);
  const [tagsInput, setTagsInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredCategories = useMemo(() => {
    if (form.type === "transfer") return [];
    return categories.filter((cat) => cat.type === form.type);
  }, [categories, form.type]);

  const requiresCategory = form.type === "income" || form.type === "expense";
  const requiresTransferAccount = form.type === "transfer";

  const canSubmit = useMemo(() => {
    if (!form.title.trim()) return false;
    if (!form.accountId) return false;
    if (Number(form.amount) <= 0) return false;
    if (!form.transactionDate) return false;

    if (requiresCategory && !form.categoryId) return false;
    if (requiresTransferAccount && !form.toAccountId) return false;
    if (
      requiresTransferAccount &&
      form.accountId &&
      form.toAccountId &&
      form.accountId === form.toAccountId
    ) {
      return false;
    }

    return true;
  }, [form, requiresCategory, requiresTransferAccount]);

  const resetForm = () => {
    setForm(initialState);
    setTagsInput("");
  };

  const handleClose = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      resetForm();
      setIsSubmitting(false);
    }
  };

  const handleTypeChange = (value: TransactionType) => {
    setForm((prev) => ({
      ...prev,
      type: value,
      categoryId: value === "transfer" ? "" : prev.categoryId,
      toAccountId: value === "transfer" ? prev.toAccountId : "",
    }));
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    try {
      setIsSubmitting(true);

      await onSubmit?.({
        ...form,
        amount: Number(form.amount),
        title: form.title.trim(),
        description: form.description?.trim() || "",
        merchant: form.merchant?.trim() || "",
        categoryId: form.categoryId || undefined,
        toAccountId: form.toAccountId || undefined,
        tags: tagsInput
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        transactionDate: new Date(form.transactionDate).toISOString(),
      });

      handleClose(false);
    } finally {
      setIsSubmitting(false);
    }
  };
  

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-screen overflow-y-auto sm:max-w-[680px] rounded-3xl border-white/10 bg-[rgba(20,16,40,0.9)] backdrop-blur-3xl text-white">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>
            Add income, expense, or transfer transaction to your finance manager.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-2">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label>Transaction Type</Label>
              <Select value={form.type} onValueChange={handleTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Currency</Label>
              <Select
                value={form.currency}
                onValueChange={(value: CurrencyType) =>
                  setForm((prev) => ({ ...prev, currency: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">INR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tx-amount">Amount</Label>
              <Input
                id="tx-amount"
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Source Account</Label>
              <Select
                value={form.accountId}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, accountId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {requiresTransferAccount ? (
              <div className="grid gap-2">
                <Label>Destination Account</Label>
                <Select
                  value={form.toAccountId}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, toAccountId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
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
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="tx-title">Title</Label>
              <Input
                id="tx-title"
                placeholder="e.g. Lunch at Cafe"
                value={form.title}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tx-merchant">Merchant</Label>
              <Input
                id="tx-merchant"
                placeholder="e.g. Swiggy, Uber, Amazon"
                value={form.merchant}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, merchant: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="tx-date">Transaction Date</Label>
              <Input
                id="tx-date"
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

            <div className="grid gap-2">
              <Label>Payment Method</Label>
              <Select
                value={form.paymentMethod}
                onValueChange={(value: PaymentMethodType) =>
                  setForm((prev) => ({ ...prev, paymentMethod: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
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
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tx-tags">Tags</Label>
            <Input
              id="tx-tags"
              placeholder="office, food, travel"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Separate tags with commas.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tx-description">Description</Label>
            <Textarea
              id="tx-description"
              placeholder="Optional note for this transaction"
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              className="min-h-[110px] resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button className="bg-linear-to-r from-cyan-600 to-blue-700" onClick={handleSubmit} disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Transaction"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddTransactionDialog;