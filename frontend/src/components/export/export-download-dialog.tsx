'use client';

import {
  ChangeEvent, useEffect, useMemo, useState
} from 'react';
import { Button } from '@/components/ui/button';
import Checkbox from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import Input from '@/components/ui/input';
import Label from '@/components/ui/label';
import Icons from '@/components/icons';
import { cn } from '@/lib/utils';
import type { ServerChartExportFormat } from '@/lib/chart-export';

type ExportDownloadValues = {
  formats: ServerChartExportFormat[];
  sheetName: string;
  cellRange: string;
  templateWorkbookBase64?: string;
  templateWorkbookFilename?: string;
};

type ExportDownloadOption = {
  value: ServerChartExportFormat;
  label: string;
  description: string;
  accent: string;
  icon: keyof Pick<typeof Icons, 'placeholder' | 'terminal' | 'product' | 'chart'>;
};

type ExportDownloadDialogProps = {
  open: boolean;
  pending?: boolean;
  title: string;
  description: string;
  defaultSheetName: string;
  options?: ExportDownloadOption[];
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ExportDownloadValues) => void;
};

const exportOptions: ExportDownloadOption[] = [
  {
    value: 'png',
    label: 'PNG',
    description: 'Sharp image for slides and documents.',
    accent: 'bg-emerald-500',
    icon: 'placeholder'
  },
  {
    value: 'jpg',
    label: 'JPG',
    description: 'Compact image with a clean white background.',
    accent: 'bg-amber-500',
    icon: 'placeholder'
  },
  {
    value: 'webp',
    label: 'WebP',
    description: 'Modern compressed image for web usage.',
    accent: 'bg-sky-500',
    icon: 'placeholder'
  },
  {
    value: 'svg',
    label: 'SVG',
    description: 'Scalable vector export when the chart supports it.',
    accent: 'bg-violet-500',
    icon: 'chart'
  },
  {
    value: 'web-component',
    label: 'Web Component',
    description: 'Portable HTML component with interactive ECharts.',
    accent: 'bg-slate-700',
    icon: 'terminal'
  },
  {
    value: 'excel',
    label: 'Export as Excel',
    description: 'Workbook with data, formulas preserved, and the visualization embedded.',
    accent: 'bg-teal-600',
    icon: 'product'
  }
];

const DEFAULT_CELL_RANGE = 'B2:K19';
const EXCEL_RANGE_PATTERN = /^[A-Za-z]{1,3}[1-9]\d*:[A-Za-z]{1,3}[1-9]\d*$/;

const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === 'string') {
      resolve(reader.result);
      return;
    }
    reject(new Error('Unable to read this workbook.'));
  };
  reader.onerror = () => reject(new Error('Unable to read this workbook.'));
  reader.readAsDataURL(file);
});

const ExportDownloadDialog = ({
  open,
  pending = false,
  title,
  description,
  defaultSheetName,
  options = exportOptions,
  onOpenChange,
  onSubmit
}: ExportDownloadDialogProps) => {
  const [selectedFormats, setSelectedFormats] = useState<ServerChartExportFormat[]>(['png']);
  const [sheetName, setSheetName] = useState(defaultSheetName);
  const [cellRange, setCellRange] = useState(DEFAULT_CELL_RANGE);
  const [templateWorkbook, setTemplateWorkbook] = useState<File | null>(null);
  const [filePending, setFilePending] = useState(false);
  const [showSelectionError, setShowSelectionError] = useState(false);
  const [rangeError, setRangeError] = useState('');
  const selectedCount = selectedFormats.length;
  const excelSelected = selectedFormats.includes('excel');

  const helperText = useMemo(() => {
    if (selectedCount === 0) {
      return 'Select at least one format.';
    }
    return selectedCount === 1
      ? 'One file will download directly.'
      : `${selectedCount} files will be packed into one ZIP.`;
  }, [selectedCount]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setSelectedFormats(['png']);
    setSheetName(defaultSheetName);
    setCellRange(DEFAULT_CELL_RANGE);
    setTemplateWorkbook(null);
    setShowSelectionError(false);
    setRangeError('');
  }, [defaultSheetName, open]);

  const toggleFormat = (format: ServerChartExportFormat) => {
    setShowSelectionError(false);
    setSelectedFormats((current) => (current.includes(format)
      ? current.filter((item) => item !== format)
      : [...current, format]));
  };

  const handleDownload = async () => {
    if (!selectedFormats.length) {
      setShowSelectionError(true);
      return;
    }

    const normalizedRange = cellRange.trim().toUpperCase();
    if (excelSelected && !EXCEL_RANGE_PATTERN.test(normalizedRange)) {
      setRangeError('Use a range like H3:Z10.');
      return;
    }

    let workbookPayload: string | undefined;
    try {
      setFilePending(true);
      workbookPayload = excelSelected && templateWorkbook
        ? await readFileAsDataUrl(templateWorkbook)
        : undefined;
    } catch (error) {
      setRangeError(error instanceof Error ? error.message : 'Unable to read this workbook.');
      return;
    } finally {
      setFilePending(false);
    }

    onSubmit({
      formats: selectedFormats,
      sheetName: sheetName.trim() || defaultSheetName,
      cellRange: normalizedRange,
      templateWorkbookBase64: workbookPayload,
      templateWorkbookFilename: templateWorkbook?.name
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] max-w-3xl overflow-hidden p-0">
        <div className="flex max-h-[calc(100vh-2rem)] flex-col">
          <DialogHeader className="border-b bg-muted/20 px-6 py-5">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Icons.download className="h-4 w-4" />
              </span>
              {title}
            </DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto px-6 py-5">
            <div className="grid gap-3 sm:grid-cols-2">
              {options.map((option) => {
                const checked = selectedFormats.includes(option.value);
                const Icon = Icons[option.icon];
                return (
                  <div
                    key={option.value}
                    role="button"
                    tabIndex={0}
                    aria-pressed={checked}
                    onClick={() => toggleFormat(option.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        toggleFormat(option.value);
                      }
                    }}
                    className={cn(
                      'cursor-pointer',
                      'group flex min-h-[104px] items-start gap-3 rounded-lg border bg-background p-4 text-left shadow-sm transition-all',
                      'hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/15',
                      checked && 'border-primary bg-primary/[0.04] shadow-md'
                    )}
                  >
                    <span className={cn('mt-1 h-2.5 w-2.5 shrink-0 rounded-full', option.accent)} />
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold text-foreground">{option.label}</span>
                      </span>
                      <span className="text-sm leading-5 text-muted-foreground">{option.description}</span>
                    </span>
                    <Checkbox
                      type="button"
                      checked={checked}
                      aria-label={`Select ${option.label}`}
                      onCheckedChange={() => toggleFormat(option.value)}
                      onClick={(event) => event.stopPropagation()}
                    />
                  </div>
                );
              })}
            </div>

            <div className={cn(
              'mt-5 rounded-lg border bg-muted/20 p-4 transition-all',
              excelSelected ? 'opacity-100' : 'opacity-60'
            )}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Excel placement</p>
                  <p className="text-sm text-muted-foreground">
                    Used only when Export as Excel is selected. The visualization is placed over this exact range.
                  </p>
                </div>
                <span className="rounded-full bg-background px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
                  {helperText}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr]">
                <div className="space-y-2">
                  <Label htmlFor="export-sheet-name">Sheet</Label>
                  <Input
                    id="export-sheet-name"
                    name="sheetName"
                    value={sheetName}
                    maxLength={31}
                    disabled={!excelSelected || pending}
                    onChange={(event) => setSheetName(event.target.value)}
                    placeholder="Sheet1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="export-cell-range">Cell range</Label>
                  <Input
                    id="export-cell-range"
                    name="cellRange"
                    value={cellRange}
                    disabled={!excelSelected || pending}
                    onChange={(event) => {
                      setRangeError('');
                      setCellRange(event.target.value);
                    }}
                    placeholder="H3:Z10"
                  />
                </div>
              </div>
              <div className="mt-3 space-y-2">
                <Label htmlFor="export-template-workbook">Existing workbook</Label>
                <Input
                  id="export-template-workbook"
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  disabled={!excelSelected || pending}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    setTemplateWorkbook(event.target.files?.[0] ?? null);
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Optional. If provided, Illustry keeps the workbook sheets and formulas and inserts only the visualization.
                </p>
              </div>
              {rangeError && <p className="mt-2 text-sm font-medium text-destructive">{rangeError}</p>}
            </div>

            {showSelectionError && (
              <p className="mt-3 text-sm font-medium text-destructive" role="alert">
                Select at least one export option before downloading.
              </p>
            )}
          </div>

          <DialogFooter className="border-t bg-background px-6 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={pending || filePending || selectedCount === 0}
              onClick={() => void handleDownload()}
            >
              {pending || filePending ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  Preparing
                </>
              ) : (
                <>
                  <Icons.download className="mr-2 h-4 w-4" />
                  Download
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDownloadDialog;
export { exportOptions };
export type { ExportDownloadOption, ExportDownloadValues };
