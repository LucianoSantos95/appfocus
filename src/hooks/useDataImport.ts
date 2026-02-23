import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { parseSpreadsheetFile, autoMapColumns, type ParsedSpreadsheet } from '@/lib/spreadsheet';
import { type ImportConfig } from '@/lib/import-configs';

export interface ImportState {
  step: 'idle' | 'parsing' | 'mapping' | 'importing' | 'done' | 'error';
  parsedData: ParsedSpreadsheet | null;
  columnMapping: Record<string, string>;
  progress: number;
  importedCount: number;
  errorCount: number;
  errors: string[];
}

export interface UseDataImportReturn {
  state: ImportState;
  parseFile: (file: File) => Promise<void>;
  setColumnMapping: (mapping: Record<string, string>) => void;
  importData: (onRecordImported?: (record: Record<string, unknown>) => void) => Promise<Record<string, unknown>[]>;
  reset: () => void;
}

const BATCH_SIZE = 50;

export function useDataImport(config: ImportConfig): UseDataImportReturn {
  const [state, setState] = useState<ImportState>({
    step: 'idle',
    parsedData: null,
    columnMapping: {},
    progress: 0,
    importedCount: 0,
    errorCount: 0,
    errors: [],
  });

  const parseFile = useCallback(async (file: File) => {
    setState(prev => ({ ...prev, step: 'parsing', errors: [] }));
    
    try {
      const parsed = await parseSpreadsheetFile(file);
      
      // Auto-map columns
      const mapping = autoMapColumns(parsed.headers, config.fields);
      
      setState({
        step: 'mapping',
        parsedData: parsed,
        columnMapping: mapping,
        progress: 0,
        importedCount: 0,
        errorCount: 0,
        errors: [],
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        step: 'error',
        errors: [error instanceof Error ? error.message : 'Erro ao processar arquivo'],
      }));
    }
  }, [config.fields]);

  const setColumnMapping = useCallback((mapping: Record<string, string>) => {
    setState(prev => ({ ...prev, columnMapping: mapping }));
  }, []);

  const transformRecord = useCallback((
    row: Record<string, unknown>,
    mapping: Record<string, string>
  ): Record<string, unknown> => {
    const transformed: Record<string, unknown> = {};
    
    for (const [header, fieldKey] of Object.entries(mapping)) {
      if (fieldKey && fieldKey !== 'ignore' && row[header] !== undefined) {
        let value = row[header];
        
        // Find field config for type conversion
        const field = config.fields.find(f => f.key === fieldKey);
        
        if (field?.type === 'number' && value !== '') {
          const numValue = parseFloat(String(value).replace(/[^\d.,\-]/g, '').replace(',', '.'));
          value = isNaN(numValue) ? null : numValue;
        } else if (field?.type === 'date' && value !== '') {
          // Try to parse various date formats
          const dateStr = String(value);
          const parsed = new Date(dateStr);
          if (!isNaN(parsed.getTime())) {
            value = parsed.toISOString().split('T')[0];
          }
        }
        
        transformed[fieldKey] = value;
      }
    }
    
    return transformed;
  }, [config.fields]);

  const validateRecord = useCallback((record: Record<string, unknown>): string[] => {
    const errors: string[] = [];
    
    for (const field of config.fields) {
      if (field.required && !record[field.key]) {
        errors.push(`Campo obrigatório "${field.label}" está vazio`);
      }
    }
    
    return errors;
  }, [config.fields]);

  const importData = useCallback(async (
    onRecordImported?: (record: Record<string, unknown>) => void
  ): Promise<Record<string, unknown>[]> => {
    if (!state.parsedData) {
      throw new Error('Nenhum dado para importar');
    }

    setState(prev => ({ ...prev, step: 'importing', progress: 0 }));

    const importedRecords: Record<string, unknown>[] = [];
    const errors: string[] = [];
    let importedCount = 0;
    let errorCount = 0;

    const { rows } = state.parsedData;
    const totalRows = rows.length;

    // Process in batches
    for (let i = 0; i < totalRows; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const transformedBatch: Record<string, unknown>[] = [];

      for (const row of batch) {
        const transformed = transformRecord(row, state.columnMapping);
        const validationErrors = validateRecord(transformed);

        if (validationErrors.length > 0) {
          errors.push(`Linha ${i + batch.indexOf(row) + 2}: ${validationErrors.join(', ')}`);
          errorCount++;
        } else {
          transformedBatch.push(transformed);
        }
      }

      // If we have a Supabase table, insert there
      if (config.table && transformedBatch.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const supabaseAny = supabase as any;
        const { data, error } = await supabaseAny
          .from(config.table)
          .insert(transformedBatch)
          .select();

        if (error) {
          errors.push(`Erro ao inserir lote: ${error.message}`);
          errorCount += transformedBatch.length;
        } else {
          importedCount += transformedBatch.length;
          if (data) {
            importedRecords.push(...data);
            if (onRecordImported) {
              data.forEach(record => onRecordImported(record));
            }
          }
        }
      } else {
        // No Supabase table - just return transformed records
        importedCount += transformedBatch.length;
        importedRecords.push(...transformedBatch);
        if (onRecordImported) {
          transformedBatch.forEach(record => onRecordImported(record));
        }
      }

      // Update progress
      const progress = Math.round(((i + batch.length) / totalRows) * 100);
      setState(prev => ({
        ...prev,
        progress,
        importedCount,
        errorCount,
        errors: errors.slice(-10), // Keep last 10 errors
      }));
    }

    setState(prev => ({
      ...prev,
      step: 'done',
      progress: 100,
      importedCount,
      errorCount,
      errors: errors.slice(-10),
    }));

    return importedRecords;
  }, [state.parsedData, state.columnMapping, config.table, transformRecord, validateRecord]);

  const reset = useCallback(() => {
    setState({
      step: 'idle',
      parsedData: null,
      columnMapping: {},
      progress: 0,
      importedCount: 0,
      errorCount: 0,
      errors: [],
    });
  }, []);

  return {
    state,
    parseFile,
    setColumnMapping,
    importData,
    reset,
  };
}
