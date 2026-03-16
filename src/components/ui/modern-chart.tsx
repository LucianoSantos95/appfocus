import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function ChartCard({ title, subtitle, children, className, action }: ChartCardProps) {
  return (
    <div
      className={cn(
        "bg-gradient-to-br from-card via-card to-card/80 rounded-2xl border border-border/50",
        "shadow-[0_8px_32px_-8px_hsl(var(--primary)/0.1)] backdrop-blur-sm",
        "p-6 transition-all duration-300 hover:shadow-[0_12px_40px_-8px_hsl(var(--primary)/0.15)]",
        className
      )}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-foreground text-base">{title}</h3>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

// Gradient definitions for modern look
export const chartGradients = (
  <defs>
    <linearGradient id="gradientPrimary" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
    </linearGradient>
    <linearGradient id="gradientSuccess" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.4} />
      <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0.05} />
    </linearGradient>
    <linearGradient id="gradientDestructive" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.4} />
      <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0.05} />
    </linearGradient>
    <linearGradient id="gradientWarning" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="hsl(var(--warning))" stopOpacity={0.4} />
      <stop offset="100%" stopColor="hsl(var(--warning))" stopOpacity={0.05} />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur" />
      <feMerge>
        <feMergeNode in="coloredBlur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);

// Modern tooltip style
export const modernTooltipStyle = {
  backgroundColor: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "12px",
  boxShadow: "0 8px 32px -4px hsl(var(--primary)/0.15)",
  padding: "12px 16px",
  color: "#ffffff",
};

// Chart axis style
export const chartAxisStyle = {
  stroke: "hsl(var(--muted-foreground))",
  fontSize: 11,
  fontFamily: "Inter, sans-serif",
};

// Modern grid style
export const modernGridStyle = {
  strokeDasharray: "4 4",
  stroke: "hsl(var(--border)/0.5)",
};

// Legend component with modern styling
export function ChartLegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <div
        className="w-3 h-3 rounded-full ring-2 ring-offset-1 ring-offset-background"
        style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}40` }}
      />
      <span className="text-muted-foreground font-medium">{label}</span>
    </div>
  );
}

export function ChartLegend({ items }: { items: { color: string; label: string; value?: string }[] }) {
  return (
    <div className="flex flex-wrap gap-4 justify-center mt-4">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}50` }}
          />
          <span className="text-xs text-muted-foreground">{item.label}</span>
          {item.value && (
            <span className="text-xs text-foreground font-medium">{item.value}</span>
          )}
        </div>
      ))}
    </div>
  );
}

// Export recharts components for convenience
export {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
};
