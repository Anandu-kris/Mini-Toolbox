import type { ReactNode } from "react";

type Props = {
  title: string;
  description: string;
  icon?: ReactNode;
};

const FinanceEmptyState = ({ title, description, icon }: Props) => {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-3xl border border-border/10 bg-card/5 px-6 py-10 text-center">
      {icon ? <div className="mb-4">{icon}</div> : null}
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {description}
      </p>
    </div>
  );
};

export default FinanceEmptyState;