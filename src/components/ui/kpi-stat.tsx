import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { CountUp } from "@/components/motion";

type Format = "currency" | "currency-compact" | "number" | "percent";
type Variant = "default" | "success" | "warning" | "destructive" | "muted";

interface KPIStatProps {
  value: number;
  label: string;
  icon?: LucideIcon;
  format?: Format;
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  trend?: { value: number; isPositive: boolean };
  className?: string;
}

const variantColor: Record<Variant, string> = {
  default: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
  muted: "text-muted-foreground",
};

const iconBg: Record<Variant, string> = {
  default: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  muted: "bg-muted/40 text-muted-foreground",
};

const sizes = {
  sm: { num: "text-xl", pad: "p-4" },
  md: { num: "text-2xl", pad: "p-5" },
  lg: { num: "text-3xl", pad: "p-5" },
};

function formatValue(v: number, format: Format): { prefix: string; decimals: number; suffix: string; format?: (n: number) => string } {
  switch (format) {
    case "currency":
      return { prefix: "R$ ", decimals: 0, suffix: "" };
    case "currency-compact":
      return {
        prefix: "",
        decimals: 0,
        suffix: "",
        format: (n: number) => {
          if (Math.abs(n) >= 1_000_000) return `R$ ${(n / 1_000_000).toFixed(1)}M`;
          if (Math.abs(n) >= 1_000) return `R$ ${(n / 1_000).toFixed(1)}K`;
          return `R$ ${n.toLocaleString("pt-BR")}`;
        },
      };
    case "percent":
      return { prefix: "", decimals: 0, suffix: "%" };
    default:
      return { prefix: "", decimals: 0, suffix: "" };
  }
}

/**
 * KPI unificado — números com count-up, tipografia display, formatação pt-BR.
 * Use em módulos para manter consistência visual com o Home.
 */
export function KPIStat({
  value,
  label,
  icon: Icon,
  format = "number",
  variant = "default",
  size = "md",
  trend,
  className,
}: KPIStatProps) {
  const fmt = formatValue(value, format);
  const s = sizes[size];

  return (
    <div
      className={cn(
        "relative flex flex-col gap-3 rounded-lg bg-card border border-border/50 shadow-premium",
        s.pad,
        className
      )}
    >
      <div className="flex items-center justify-between">
        {Icon && (
          <div className={cn("flex items-center justify-center w-10 h-10 rounded-lg", iconBg[variant])}>
            <Icon className="w-5 h-5" />
          </div>
        )}
        {trend && (
          <span
            className={cn(
              "text-xs font-medium px-2 py-1 rounded-full",
              trend.isPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
            )}
          >
            {trend.isPositive ? "+" : ""}
            {trend.value}%
          </span>
        )}
      </div>
      <div>
        <p className={cn("font-display font-bold tracking-tight tabular-nums", s.num, variantColor[variant])}>
          <CountUp
            value={value}
            prefix={fmt.prefix}
            suffix={fmt.suffix}
            decimals={fmt.decimals}
            format={fmt.format}
          />
        </p>
        <p className="text-sm text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
}
