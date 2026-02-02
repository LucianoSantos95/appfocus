import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImportProgressProps {
  progress: number;
  importedCount: number;
  errorCount: number;
  totalCount: number;
  errors: string[];
  isComplete: boolean;
}

export function ImportProgress({
  progress,
  importedCount,
  errorCount,
  totalCount,
  errors,
  isComplete,
}: ImportProgressProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {isComplete ? (
          errorCount === 0 ? (
            <CheckCircle2 className="w-6 h-6 text-success" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-warning" />
          )
        ) : (
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        )}
        <div className="flex-1">
          <p className="font-medium text-foreground">
            {isComplete
              ? errorCount === 0
                ? 'Importação concluída!'
                : 'Importação concluída com avisos'
              : 'Importando dados...'}
          </p>
          <p className="text-sm text-muted-foreground">
            {importedCount} de {totalCount} registros importados
          </p>
        </div>
      </div>

      <Progress value={progress} className="h-2" />

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10">
          <CheckCircle2 className="w-5 h-5 text-success" />
          <div>
            <p className="text-sm font-medium text-foreground">{importedCount}</p>
            <p className="text-xs text-muted-foreground">Importados</p>
          </div>
        </div>
        <div className={cn(
          "flex items-center gap-2 p-3 rounded-lg",
          errorCount > 0 ? "bg-destructive/10" : "bg-muted/50"
        )}>
          <XCircle className={cn("w-5 h-5", errorCount > 0 ? "text-destructive" : "text-muted-foreground")} />
          <div>
            <p className="text-sm font-medium text-foreground">{errorCount}</p>
            <p className="text-xs text-muted-foreground">Erros</p>
          </div>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-destructive">Últimos erros:</p>
          <div className="max-h-[100px] overflow-y-auto space-y-1">
            {errors.map((error, index) => (
              <p key={index} className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                {error}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
