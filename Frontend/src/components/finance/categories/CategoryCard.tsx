import {
  Pencil,
  Trash2,
  Wallet,
  Coffee,
  Receipt,
  Landmark,
  Utensils,
  ShoppingCart,
  Film,
  type LucideIcon,
  CalendarCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const iconMap: Record<string, LucideIcon> = {
  entertainment: Film,
  subscription: CalendarCheck,
  wallet: Wallet,
  coffee: Coffee,
  receipt: Receipt,
  bank: Landmark,
  food: Utensils,
  shopping: ShoppingCart,
};

type Props = {
  name: string;
  type: "income" | "expense";
  color?: string;
  icon?: string;
  onEdit?: () => void;
  onDelete?: () => void;
};

const CategoryCard = ({ name, type, color, icon, onEdit, onDelete }: Props) => {
  const normalizedIcon = icon?.trim().toLowerCase();
  const Icon = normalizedIcon ? iconMap[normalizedIcon] : undefined;

  console.log("CategoryCard:", {
    name,
    icon,
    normalizedIcon,
    IconFound: !!Icon,
  });

  console.log("icon debug =>", {
    raw: icon,
    normalized: icon?.trim().toLowerCase(),
    keys: Object.keys(iconMap),
  });

  return (
    <div className="flex items-center justify-between rounded-2xl border border-border/30 bg-background/40 px-4 py-3">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: color || "#6366F1" }}
        >
          {Icon ? (
            <Icon className="h-4 w-4 text-white" />
          ) : (
            <span className="h-2.5 w-2.5 rounded-full bg-white" />
          )}
        </div>

        <div>
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs capitalize text-muted-foreground">{type}</p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button size="icon" variant="ghost" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default CategoryCard;
