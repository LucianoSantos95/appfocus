import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Input de moeda BRL com digitação centavos-primeiro (da direita pra esquerda).
// Exibe "1.234,56"; o valor devolvido é numérico (1234.56).

function formatarCentavos(centavos: number) {
  return (centavos / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

interface CurrencyInputProps
  extends Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> {
  value: number | null | undefined;
  onValueChange: (value: number | null) => void;
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onValueChange, className, ...props }, ref) => {
    const centavos =
      value == null || Number.isNaN(Number(value)) ? null : Math.round(Number(value) * 100);

    const texto = centavos == null ? "" : formatarCentavos(centavos);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const digitos = e.target.value.replace(/\D/g, "");
      if (!digitos) return onValueChange(null);
      // limite defensivo pra não estourar precisão
      const novos = Number(digitos.slice(0, 13));
      onValueChange(novos / 100);
    };

    return (
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          R$
        </span>
        <Input
          ref={ref}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={texto}
          onChange={handleChange}
          placeholder="0,00"
          className={cn("pl-9", className)}
          {...props}
        />
      </div>
    );
  }
);
CurrencyInput.displayName = "CurrencyInput";
