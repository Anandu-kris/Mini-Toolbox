import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "violet" | "cyan" | "emerald" | "gray";
};

const glowMap = {
  violet: "from-violet-500/40 to-purple-600/20",
  cyan: "from-cyan-400/40 to-blue-500/20",
  emerald: "from-emerald-400/40 to-green-500/20",
  gray: "from-gray-400/30 to-gray-600/10",
};

export default function FeatureCard({
  title,
  description,
  icon,
  onClick,
  disabled,
  variant = "violet",
}: Props) {
  return (
    <>
      <Card
        onClick={!disabled ? onClick : undefined}
        className={cn(
          "group relative cursor-pointer overflow-hidden rounded-2xl",
          "bg-black/30 backdrop-blur-3xl",
          "border border-white/10",
          "transition-all duration-300",
          "hover:-translate-y-1 hover:border-white/20",
          disabled &&
            "opacity-50 cursor-not-allowed hover:translate-y-0 hover:border-white/10",
        )}
      >
        {/* Neon border glow */}
        <div
          className={cn(
            "pointer-events-none absolute inset-0 rounded-2xl",
            "bg-linear-to-br opacity-0 blur-xl transition-opacity duration-300",
            glowMap[variant],
            !disabled && "group-hover:opacity-100",
          )}
        />

        {/* Inner content */}
        <CardContent className="relative z-10 p-6 flex flex-col gap-4">
          {/* Icon */}
          <div
            className={cn(
              "w-fit rounded-xl p-3",
              "bg-white/10 backdrop-blur-md",
              "shadow-inner",
              "ring-1 ring-white/10",
              !disabled && "group-hover:ring-white/20",
            )}
          >
            <div
              className={cn(
                "transition-colors",
                variant === "violet" && "text-violet-300",
                variant === "cyan" && "text-cyan-300",
                variant === "emerald" && "text-emerald-300",
                variant === "gray" && "text-gray-300",
              )}
            >
              {icon}
            </div>
          </div>

          {/* Text */}
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="mt-1 text-sm text-white/70">{description}</p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
