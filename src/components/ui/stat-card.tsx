import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { CountUp } from "@/components/motion";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "success" | "warning" | "destructive";
  className?: string;
}

const variantStyles = {
  default: "text-primary",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
};

/**
 * Parses a display string like "R$ 12.345" or "42" into { prefix, number, suffix }
 * so we can drive a count-up animation while preserving formatting.
 */
function parseValue(value: string): { prefix: string; num: number | null; suffix: string } {
  const match = value.match(/^([^\d\-]*)(-?[\d.,]+)(.*)$/);
  if (!match) return { prefix: "", num: null, suffix: "" };
  const [, prefix, numStr, suffix] = match;
  // pt-BR format: "12.345,67" — remove thousands, swap decimal
  const normalized = numStr.replace(/\./g, "").replace(",", ".");
  const num = Number(normalized);
  if (!Number.isFinite(num)) return { prefix: "", num: null, suffix: "" };
  const decimals = normalized.includes(".") ? normalized.split(".")[1].length : 0;
  return { prefix, num, suffix, ...({ decimals } as any) };
}

export function StatCard({ icon: Icon, label, value, trend, variant = "default", className }: StatCardProps) {
  const parsed = parseValue(value);
  return (
    <div
      className={cn(
        "relative flex flex-col gap-3 p-5 rounded-lg",
        "bg-card border border-border/50 shadow-premium",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className={cn("flex items-center justify-center w-10 h-10 rounded-lg bg-opacity-10",
          variant === "default" && "bg-primary/10",
          variant === "success" && "bg-success/10",
          variant === "warning" && "bg-warning/10",
          variant === "destructive" && "bg-destructive/10"
        )}>
          <Icon className={cn("w-5 h-5", variantStyles[variant])} />
        </div>
        {trend && (
          <span className={cn(
            "text-xs font-medium px-2 py-1 rounded-full",
            trend.isPositive
              ? "bg-success/10 text-success"
              : "bg-destructive/10 text-destructive"
          )}>
            {trend.isPositive ? "+" : ""}{trend.value}%
          </span>
        )}
      </div>
      <div>
        <p className="font-display text-2xl font-bold text-foreground tracking-tight tabular-nums">
          {parsed.num !== null ? (
            <CountUp value={parsed.num} prefix={parsed.prefix} suffix={parsed.suffix} decimals={(parsed as any).decimals ?? 0} />
          ) : (
            value
          )}
        </p>
        <p className="text-sm text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
}

