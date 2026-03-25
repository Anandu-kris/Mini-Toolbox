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

import type { AccountType, CurrencyType } from "@/types/finance_manager.types";

type AddAccountPayload = {
  name: string;
  type: AccountType;
  currency: CurrencyType;
  openingBalance: number;
  institution?: string;
  notes?: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (payload: AddAccountPayload) => Promise<void> | void;
};

const initialState: AddAccountPayload = {
  name: "",
  type: "bank",
  currency: "INR",
  openingBalance: 0,
  institution: "",
  notes: "",
};

const AddAccountDialog = ({ open, onOpenChange, onSubmit }: Props) => {
  const [form, setForm] = useState<AddAccountPayload>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    return form.name.trim().length > 0 && Number(form.openingBalance) >= 0;
  }, [form]);

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
        ...form,
        name: form.name.trim(),
        institution: form.institution?.trim() || "",
        notes: form.notes?.trim() || "",
        openingBalance: Number(form.openingBalance),
      });
      handleClose(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[560px] rounded-3xl border-white/10 bg-[rgba(20,16,40,0.9)] backdrop-blur-3xl text-white">
        <DialogHeader>
          <DialogTitle>Add Account</DialogTitle>
          <DialogDescription>
            Create a finance account such as bank, wallet, cash, or credit card.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-2">
          <div className="grid gap-2">
            <Label htmlFor="account-name">Account Name</Label>
            <Input
              id="account-name"
              placeholder="e.g. SBI Savings"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Account Type</Label>
              <Select
                value={form.type}
                onValueChange={(value: AccountType) =>
                  setForm((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank">Bank</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="wallet">Wallet</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="investment">Investment</SelectItem>
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
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="opening-balance">Opening Balance</Label>
              <Input
                id="opening-balance"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.openingBalance}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    openingBalance: Number(e.target.value),
                  }))
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="institution">Institution</Label>
              <Input
                id="institution"
                placeholder="e.g. State Bank of India"
                value={form.institution}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, institution: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="account-notes">Notes</Label>
            <Textarea
              id="account-notes"
              placeholder="Optional notes about this account"
              value={form.notes}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, notes: e.target.value }))
              }
              className="min-h-[110px] resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-3 sm:gap-3">
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button className="bg-linear-to-r from-cyan-600 to-blue-700" onClick={handleSubmit} disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddAccountDialog;