type Props = {
  name: string;
  amount: string;
  spent: string;
  progress: number;
};

const BudgetCard = ({ name, amount, spent, progress }: Props) => {
  return (
    <div className="rounded-3xl border border-border/10 bg-card/5 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold">{name}</p>
          <p className="mt-1 text-sm text-muted-foreground">Budget: {amount}</p>
        </div>
        <span className="text-sm font-semibold">{progress}%</span>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-blue-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="mt-3 text-sm text-muted-foreground">Spent: {spent}</p>
    </div>
  );
};

export default BudgetCard;