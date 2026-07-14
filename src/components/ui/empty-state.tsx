import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * Padronizado empty state — usar sempre que uma lista/painel estiver vazio.
 * Substitui strings soltas ("Nenhum registro") por uma experiência com ícone + CTA.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondaryAction,
  className,
  size = "md",
}: EmptyStateProps) {
  const sizes = {
    sm: { wrap: "py-8", icon: "w-10 h-10", iconWrap: "w-14 h-14", title: "text-base" },
    md: { wrap: "py-12", icon: "w-12 h-12", iconWrap: "w-20 h-20", title: "text-lg" },
    lg: { wrap: "py-16", icon: "w-14 h-14", iconWrap: "w-24 h-24", title: "text-xl" },
  }[size];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center px-6",
        sizes.wrap,
        className
      )}
    >
      <div
        className={cn(
          "rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center mb-4",
          sizes.iconWrap
        )}
      >
        <Icon className={cn("text-primary/70", sizes.icon)} strokeWidth={1.5} />
      </div>
      <h3 className={cn("font-semibold text-foreground mb-1.5", sizes.title)}>{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-5">{description}</p>
      )}
      {(actionLabel || secondaryLabel) && (
        <div className="flex gap-2">
          {actionLabel && onAction && (
            <Button onClick={onAction} size="sm">
              {actionLabel}
            </Button>
          )}
          {secondaryLabel && onSecondaryAction && (
            <Button onClick={onSecondaryAction} size="sm" variant="outline">
              {secondaryLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
