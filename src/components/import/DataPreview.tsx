import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface DataPreviewProps {
  headers: string[];
  rows: Record<string, unknown>[];
  maxRows?: number;
}

export function DataPreview({ headers, rows, maxRows = 5 }: DataPreviewProps) {
  const previewRows = rows.slice(0, maxRows);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">Preview dos Dados</p>
        <p className="text-xs text-muted-foreground">
          Mostrando {previewRows.length} de {rows.length} registros
        </p>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto max-h-[200px]">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm">
              <TableRow>
                {headers.map((header, index) => (
                  <TableHead key={index} className="whitespace-nowrap text-xs">
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewRows.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {headers.map((header, colIndex) => (
                    <TableCell key={colIndex} className="text-xs py-2 whitespace-nowrap max-w-[150px] truncate">
                      {String(row[header] ?? '')}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
