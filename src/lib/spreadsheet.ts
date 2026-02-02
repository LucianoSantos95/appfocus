import * as XLSX from 'xlsx';

export interface ParsedSpreadsheet {
  headers: string[];
  rows: Record<string, unknown>[];
  totalRows: number;
}

export function parseSpreadsheetFile(file: File): Promise<ParsedSpreadsheet> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON with headers
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { 
          raw: false,
          defval: '' 
        });
        
        // Extract headers from the first row
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        const headers: string[] = [];
        
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: col });
          const cell = worksheet[cellAddress];
          headers.push(cell ? String(cell.v) : `Coluna ${col + 1}`);
        }
        
        resolve({
          headers,
          rows: jsonData,
          totalRows: jsonData.length,
        });
      } catch (error) {
        reject(new Error('Erro ao processar arquivo. Verifique se é um arquivo Excel (.xlsx) ou CSV válido.'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo.'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

export function generateTemplate(fields: { key: string; label: string }[], moduleName: string): void {
  const workbook = XLSX.utils.book_new();
  
  // Create headers row
  const headers = fields.map(f => f.label);
  
  // Create example data row
  const exampleData = fields.map(f => {
    switch (f.key) {
      case 'nome':
      case 'name':
      case 'title':
        return 'Exemplo Nome';
      case 'email':
        return 'exemplo@email.com';
      case 'telefone':
      case 'phone':
        return '(11) 99999-9999';
      case 'valor_total':
      case 'value':
      case 'budget':
      case 'salary':
        return '1000.00';
      case 'date':
      case 'startDate':
      case 'endDate':
      case 'dueDate':
        return new Date().toISOString().split('T')[0];
      case 'status':
        return 'ativo';
      case 'type':
        return 'receita';
      case 'priority':
        return 'media';
      default:
        return '';
    }
  });
  
  const worksheetData = [headers, exampleData];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
  // Set column widths
  const colWidths = headers.map(h => ({ wch: Math.max(h.length + 2, 15) }));
  worksheet['!cols'] = colWidths;
  
  XLSX.utils.book_append_sheet(workbook, worksheet, moduleName);
  
  // Download
  XLSX.writeFile(workbook, `template_${moduleName.toLowerCase().replace(/\s+/g, '_')}.xlsx`);
}

export function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9]/g, '') // Remove caracteres especiais
    .trim();
}

export function autoMapColumns(
  headers: string[],
  fields: { key: string; label: string; aliases: string[] }[]
): Record<string, string> {
  const mapping: Record<string, string> = {};
  
  headers.forEach((header) => {
    const normalizedHeader = normalizeHeader(header);
    
    for (const field of fields) {
      const allNames = [field.label, field.key, ...field.aliases];
      const match = allNames.some(name => normalizeHeader(name) === normalizedHeader);
      
      if (match) {
        mapping[header] = field.key;
        break;
      }
    }
  });
  
  return mapping;
}
