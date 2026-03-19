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
  FinanceAccountItem,
  FinanceAccountUpdatePayload,
} from "@/services/finance_manager.service";
import type { AccountType, CurrencyType } from "@/types/finance_manager.types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: FinanceAccountItem | null;
  onSubmit?: (payload: FinanceAccountUpdatePayload) => Promise<void> | void;
};

const EditAccountDialog = ({
  open,
  onOpenChange,
  account,
  onSubmit,
}: Props) => {
  const [form, setForm] = useState<FinanceAccountUpdatePayload>({
    name: "",
    type: "bank",
    currency: "INR",
    openingBalance: 0,
    institution: "",
    notes: "",
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!account) return;
    setForm({
      name: account.name,
      type: account.type,
      currency: account.currency,
      openingBalance: account.openingBalance,
      institution: account.institution ?? "",
      notes: account.notes ?? "",
      isActive: account.isActive,
    });
  }, [account]);

  const canSubmit = useMemo(() => {
    return !!form.name?.trim();
  }, [form.name]);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      setIsSubmitting(true);
      await onSubmit?.({
        ...form,
        name: form.name?.trim() || "",
        institution: form.institution?.trim() || "",
        notes: form.notes?.trim() || "",
        openingBalance: Number(form.openingBalance ?? 0),
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] rounded-3xl border-white/10 bg-[rgba(20,16,40,0.9)] backdrop-blur-3xl text-white">
        <DialogHeader>
          <DialogTitle>Edit Account</DialogTitle>
          <DialogDescription>Update this finance account.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-2">
          <div className="grid gap-2">
            <Label>Account Name</Label>
            <Input
              value={form.name ?? ""}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Account Type</Label>
              <Select
                value={(form.type as AccountType) ?? "bank"}
                onValueChange={(value: AccountType) =>
                  setForm((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
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
                value={(form.currency as CurrencyType) ?? "INR"}
                onValueChange={(value: CurrencyType) =>
                  setForm((prev) => ({ ...prev, currency: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
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
              <Label>Opening Balance</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.openingBalance ?? 0}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    openingBalance: Number(e.target.value),
                  }))
                }
              />
            </div>

            <div className="grid gap-2">
              <Label>Institution</Label>
              <Input
                value={form.institution ?? ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, institution: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Notes</Label>
            <Textarea
              value={form.notes ?? ""}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, notes: e.target.value }))
              }
              className="min-h-[100px] resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-linear-to-r from-cyan-600 to-blue-700"
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditAccountDialog;
