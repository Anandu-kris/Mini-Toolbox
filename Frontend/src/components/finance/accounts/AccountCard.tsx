import { Pencil, Trash2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  name: string;
  type: string;
  balance: string;
  institution?: string;
  onEdit?: () => void;
  onDelete?: () => void;
};

const gradients = [
  "from-indigo-500/20 via-purple-500/10 to-blue-500/20",
  "from-cyan-500/20 via-blue-500/10 to-indigo-500/20",
  "from-emerald-500/20 via-teal-500/10 to-cyan-500/20",
  "from-pink-500/20 via-purple-500/10 to-indigo-500/20",
  "from-orange-500/20 via-amber-500/10 to-yellow-500/20",
];

const AccountCard = ({
  name,
  type,
  balance,
  institution,
  onEdit,
  onDelete,
}: Props) => {
  const gradient =
    gradients[name.length % gradients.length];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-white/10 p-5",
        "bg-linear-to-br",
        gradient,
        "backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.25)]",
        "transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_40%)]" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md">
            <CreditCard className="h-5 w-5 text-white" />
          </div>

          <div>
            <p className="text-base font-semibold text-white">{name}</p>
            <p className="text-xs uppercase tracking-wide text-white/60">
              {type.replaceAll("_", " ")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onDelete}
            className="hover:bg-red-500/60"
          >
            <Trash2 className="h-4 w-4 text-white/90" />
          </Button>
        </div>
      </div>

      <div className="relative mt-6">
        <p className="text-xs text-white/60">Current Balance</p>
        <p className="mt-1 text-2xl font-semibold text-white">
          {balance}
        </p>
      </div>

      {institution && (
        <p className="relative mt-4 text-sm text-white/60">
          {institution}
        </p>
      )}
    </div>
  );
};

export default AccountCard;