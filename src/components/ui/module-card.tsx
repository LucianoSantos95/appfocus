import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModuleCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick?: () => void;
  className?: string;
}

export function ModuleCard({ icon: Icon, title, description, onClick, className }: ModuleCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-start gap-3 p-5 rounded-lg",
        "bg-card border border-border/50 shadow-premium",
        "transition-all duration-300 ease-out",
        "hover:border-primary/30 hover:shadow-glow hover:bg-muted/50",
        "focus:outline-none focus:ring-2 focus:ring-primary/50",
        "text-left w-full",
        className
      )}
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
          {description}
        </p>
      </div>
    </button>
  );
}
