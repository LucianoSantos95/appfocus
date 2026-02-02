import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { FileSpreadsheet, Download, Upload, Loader2 } from 'lucide-react';
import { FileDropzone } from './FileDropzone';
import { DataPreview } from './DataPreview';
import { ColumnMapper } from './ColumnMapper';
import { ImportProgress } from './ImportProgress';
import { useDataImport } from '@/hooks/useDataImport';
import { generateTemplate } from '@/lib/spreadsheet';
import { type ImportConfig } from '@/lib/import-configs';

interface ImportDialogProps {
  config: ImportConfig;
  onImportComplete?: (records: Record<string, unknown>[]) => void;
  onAnalyzeAI?: (records: Record<string, unknown>[]) => void;
  trigger?: React.ReactNode;
}

export function ImportDialog({ config, onImportComplete, onAnalyzeAI, trigger }: ImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [runAIAnalysis, setRunAIAnalysis] = useState(false);
  const { state, parseFile, setColumnMapping, importData, reset } = useDataImport(config);

  const handleFileSelect = async (file: File) => {
    await parseFile(file);
  };

  const handleImport = async () => {
    try {
      const records = await importData();
      
      if (onImportComplete) {
        onImportComplete(records);
      }
      
      if (runAIAnalysis && onAnalyzeAI && records.length > 0) {
        onAnalyzeAI(records);
      }
    } catch (error) {
      console.error('Import error:', error);
    }
  };

  const handleDownloadTemplate = () => {
    generateTemplate(config.fields, config.label);
  };

  const handleClose = () => {
    setOpen(false);
    reset();
    setRunAIAnalysis(false);
  };

  const canImport = () => {
    if (!state.parsedData) return false;
    
    // Check if all required fields are mapped
    const requiredFields = config.fields.filter(f => f.required);
    const mappedKeys = Object.values(state.columnMapping);
    
    return requiredFields.every(f => mappedKeys.includes(f.key));
  };

  return (
    <Dialog open={open} onOpenChange={(o) => {
      if (!o) handleClose();
      else setOpen(true);
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            Importar Planilha
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Importar {config.label}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Step 1: File Upload */}
          {state.step === 'idle' && (
            <FileDropzone onFileSelect={handleFileSelect} />
          )}

          {/* Step 2: Parsing */}
          {state.step === 'parsing' && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Processando arquivo...</p>
            </div>
          )}

          {/* Step 3: Mapping */}
          {state.step === 'mapping' && state.parsedData && (
            <>
              <DataPreview
                headers={state.parsedData.headers}
                rows={state.parsedData.rows}
              />

              <ColumnMapper
                headers={state.parsedData.headers}
                fields={config.fields}
                mapping={state.columnMapping}
                onMappingChange={setColumnMapping}
              />

              {config.supportsAI && onAnalyzeAI && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <Checkbox
                    id="ai-analysis"
                    checked={runAIAnalysis}
                    onCheckedChange={(checked) => setRunAIAnalysis(checked === true)}
                  />
                  <Label htmlFor="ai-analysis" className="text-sm cursor-pointer">
                    Analisar com IA após importação
                  </Label>
                </div>
              )}
            </>
          )}

          {/* Step 4: Importing */}
          {(state.step === 'importing' || state.step === 'done') && state.parsedData && (
            <ImportProgress
              progress={state.progress}
              importedCount={state.importedCount}
              errorCount={state.errorCount}
              totalCount={state.parsedData.totalRows}
              errors={state.errors}
              isComplete={state.step === 'done'}
            />
          )}

          {/* Error State */}
          {state.step === 'error' && (
            <div className="text-center py-8">
              <p className="text-destructive font-medium mb-2">Erro ao processar arquivo</p>
              {state.errors.map((error, i) => (
                <p key={i} className="text-sm text-muted-foreground">{error}</p>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleDownloadTemplate}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Baixar Template
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={handleClose}>
              {state.step === 'done' ? 'Fechar' : 'Cancelar'}
            </Button>

            {state.step === 'mapping' && (
              <Button
                onClick={handleImport}
                disabled={!canImport()}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                Importar {state.parsedData?.totalRows} registros
              </Button>
            )}

            {state.step === 'error' && (
              <Button onClick={reset}>Tentar Novamente</Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
