import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: () => void;
};

export default function LockConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="bg-gray-500/80 border border-white/10 text-white w-full max-w-lg">
        <DialogHeader>
          <DialogTitle>Lock Vault?</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-white/80">
          This will remove your vault key from memory. You will need to enter
          your master password again to unlock.
        </p>

        <DialogFooter className="mt-4">
          <div className="flex justify-between w-full">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
            >
              <Lock />
              Lock
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
