import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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

export function StatCard({ icon: Icon, label, value, trend, variant = "default", className }: StatCardProps) {
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
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
}
