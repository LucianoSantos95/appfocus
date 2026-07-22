import { ReactNode, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props<T> {
  items: T[];
  initialCount?: number;
  renderItem: (item: T, index: number) => ReactNode;
  keyFn?: (item: T, index: number) => string | number;
  className?: string;
  moreLabel?: (remaining: number) => string;
  lessLabel?: string;
}

/**
 * Renderiza os primeiros N itens e mostra "Ver mais (N)" para expandir.
 * Usado em todas as listas do app pra manter páginas leves.
 */
export function ExpandableList<T>({
  items,
  initialCount = 5,
  renderItem,
  keyFn,
  className,
  moreLabel = (n) => `Ver mais (${n})`,
  lessLabel = "Ver menos",
}: Props<T>) {
  const [expanded, setExpanded] = useState(false);
  const total = items.length;
  const visible = expanded ? items : items.slice(0, initialCount);
  const remaining = total - initialCount;

  return (
    <div className={className}>
      {visible.map((item, i) => (
        <div key={keyFn ? keyFn(item, i) : i}>{renderItem(item, i)}</div>
      ))}
      {total > initialCount && (
        <div className="mt-3 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded((v) => !v)}
            className="text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            {expanded ? lessLabel : moreLabel(remaining)}
            <ChevronDown
              className={`ml-1 w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </Button>
        </div>
      )}
    </div>
  );
}
