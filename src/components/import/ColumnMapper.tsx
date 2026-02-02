import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Check, X, ArrowRight } from 'lucide-react';
import { type ImportField } from '@/lib/import-configs';
import { cn } from '@/lib/utils';

interface ColumnMapperProps {
  headers: string[];
  fields: ImportField[];
  mapping: Record<string, string>;
  onMappingChange: (mapping: Record<string, string>) => void;
}

export function ColumnMapper({ headers, fields, mapping, onMappingChange }: ColumnMapperProps) {
  const handleMappingChange = (header: string, fieldKey: string) => {
    onMappingChange({
      ...mapping,
      [header]: fieldKey,
    });
  };

  const getMappedFieldsCount = () => {
    return Object.values(mapping).filter(v => v && v !== 'ignore').length;
  };

  const getRequiredFieldsMapped = () => {
    const required = fields.filter(f => f.required);
    const mappedKeys = Object.values(mapping);
    return required.filter(f => mappedKeys.includes(f.key)).length;
  };

  const requiredFields = fields.filter(f => f.required);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">Mapeamento de Colunas</p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{getMappedFieldsCount()} colunas mapeadas</span>
          <span className={cn(
            getRequiredFieldsMapped() === requiredFields.length ? "text-success" : "text-warning"
          )}>
            {getRequiredFieldsMapped()}/{requiredFields.length} obrigatórios
          </span>
        </div>
      </div>

      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
        {headers.map((header) => {
          const currentMapping = mapping[header];
          const isMapped = currentMapping && currentMapping !== 'ignore';
          const mappedField = fields.find(f => f.key === currentMapping);
          
          return (
            <div
              key={header}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                isMapped ? "border-primary/30 bg-primary/5" : "border-border bg-muted/30"
              )}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {isMapped ? (
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                ) : (
                  <X className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}
                <span className="text-sm font-medium text-foreground truncate">{header}</span>
              </div>
              
              <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              
              <Select
                value={currentMapping || 'ignore'}
                onValueChange={(value) => handleMappingChange(header, value)}
              >
                <SelectTrigger className="w-[180px] h-9 text-sm">
                  <SelectValue placeholder="Selecionar campo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ignore" className="text-muted-foreground">
                    Ignorar coluna
                  </SelectItem>
                  {fields.map((field) => (
                    <SelectItem key={field.key} value={field.key}>
                      {field.label}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>

      {requiredFields.length > 0 && (
        <p className="text-xs text-muted-foreground">
          <span className="text-destructive">*</span> Campos obrigatórios
        </p>
      )}
    </div>
  );
}
