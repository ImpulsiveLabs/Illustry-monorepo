'use client';

import {
  useEffect, useMemo, useState
} from 'react';
import { ExtFile } from '@files-ui/react';
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
import FileUpload from '@/components/ui/file-upload';
import Icons from '@/components/icons';
import { cn } from '@/lib/utils';
import type { ServerChartExportFormat } from '@/lib/chart-export';

type ExportDownloadValues = {
  formats: ServerChartExportFormat[];
  sheetName: string;
  cellRange: string;
  documentOptions: {
    page: number;
    width: number;
    height: number;
    placement: DocumentPlacement;
  };
  templateFiles?: Partial<Record<DocumentTemplateFormat, File>>;
};

type DocumentTemplateFormat = 'excel' | 'pdf' | 'word' | 'ppt';

type DocumentPlacement = 'top-left' | 'top-center' | 'top-right'
| 'middle-left' | 'middle-center' | 'middle-right'
| 'bottom-left' | 'bottom-center' | 'bottom-right';

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
  },
  {
    value: 'pdf',
    label: 'PDF',
    description: 'Page-based document with precise size and placement.',
    accent: 'bg-rose-500',
    icon: 'product'
  },
  {
    value: 'word',
    label: 'Word',
    description: 'DOCX document with the visualization placed on the requested page.',
    accent: 'bg-blue-600',
    icon: 'product'
  },
  {
    value: 'ppt',
    label: 'PowerPoint',
    description: 'PPTX deck with the visualization placed on the requested slide.',
    accent: 'bg-orange-600',
    icon: 'product'
  }
];

const DEFAULT_CELL_RANGE = 'B2:K19';
const EXCEL_RANGE_PATTERN = /^[A-Za-z]{1,3}[1-9]\d*:[A-Za-z]{1,3}[1-9]\d*$/;
const DOCUMENT_PLACEMENTS: Array<{ value: DocumentPlacement; label: string }> = [
  { value: 'top-left', label: 'Up left' },
  { value: 'top-center', label: 'Up middle' },
  { value: 'top-right', label: 'Up right' },
  { value: 'middle-left', label: 'Left' },
  { value: 'middle-center', label: 'Middle' },
  { value: 'middle-right', label: 'Right' },
  { value: 'bottom-left', label: 'Down left' },
  { value: 'bottom-center', label: 'Down middle' },
  { value: 'bottom-right', label: 'Down right' }
];
const TEMPLATE_UPLOADS: Array<{
  format: DocumentTemplateFormat;
  label: string;
  accept: string;
  visibleWhen: (formats: ServerChartExportFormat[]) => boolean;
}> = [
  {
    format: 'excel',
    label: 'Excel workbook',
    accept: '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    visibleWhen: (formats) => formats.includes('excel')
  },
  {
    format: 'pdf',
    label: 'PDF document',
    accept: '.pdf,application/pdf',
    visibleWhen: (formats) => formats.includes('pdf')
  },
  {
    format: 'word',
    label: 'Word document',
    accept: '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    visibleWhen: (formats) => formats.includes('word')
  },
  {
    format: 'ppt',
    label: 'PowerPoint deck',
    accept: '.pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation',
    visibleWhen: (formats) => formats.includes('ppt')
  }
];

const getExtFile = (files: ExtFile[]) => files[0]?.file instanceof File ? files[0].file : undefined;

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
  const [documentPage, setDocumentPage] = useState('1');
  const [documentWidth, setDocumentWidth] = useState('960');
  const [documentHeight, setDocumentHeight] = useState('540');
  const [documentPlacement, setDocumentPlacement] = useState<DocumentPlacement>('middle-center');
  const [templateUploads, setTemplateUploads] = useState<Record<DocumentTemplateFormat, ExtFile[]>>({
    excel: [],
    pdf: [],
    word: [],
    ppt: []
  });
  const [showSelectionError, setShowSelectionError] = useState(false);
  const [rangeError, setRangeError] = useState('');
  const selectedCount = selectedFormats.length;
  const excelSelected = selectedFormats.includes('excel');
  const documentSelected = selectedFormats.includes('pdf') || selectedFormats.includes('word') || selectedFormats.includes('ppt');
  const fileBackedExportSelected = excelSelected || documentSelected;
  const allSelected = options.length > 0 && options.every((option) => selectedFormats.includes(option.value));

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
    setDocumentPage('1');
    setDocumentWidth('960');
    setDocumentHeight('540');
    setDocumentPlacement('middle-center');
    setTemplateUploads({
      excel: [],
      pdf: [],
      word: [],
      ppt: []
    });
    setShowSelectionError(false);
    setRangeError('');
  }, [defaultSheetName, open]);

  const toggleFormat = (format: ServerChartExportFormat) => {
    setShowSelectionError(false);
    setSelectedFormats((current) => (current.includes(format)
      ? current.filter((item) => item !== format)
      : [...current, format]));
  };

  const toggleSelectAll = () => {
    setShowSelectionError(false);
    setSelectedFormats(allSelected ? [] : options.map((option) => option.value));
  };

  const updateTemplateUpload = (format: DocumentTemplateFormat, files: ExtFile[]) => {
    setTemplateUploads((current) => ({
      ...current,
      [format]: files.slice(0, 1)
    }));
  };

  const removeTemplateUpload = (format: DocumentTemplateFormat, id: string | number | undefined) => {
    setTemplateUploads((current) => ({
      ...current,
      [format]: current[format].filter((file) => file.id !== id)
    }));
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
    const normalizedDocumentPage = Math.max(1, Math.min(200, Math.round(Number(documentPage) || 1)));
    const normalizedDocumentWidth = Math.max(120, Math.min(2400, Math.round(Number(documentWidth) || 960)));
    const normalizedDocumentHeight = Math.max(120, Math.min(2400, Math.round(Number(documentHeight) || 540)));
    const templateFiles = TEMPLATE_UPLOADS.reduce<Partial<Record<DocumentTemplateFormat, File>>>((files, upload) => {
      if (!upload.visibleWhen(selectedFormats)) {
        return files;
      }
      const file = getExtFile(templateUploads[upload.format]);
      if (file) {
        files[upload.format] = file;
      }
      return files;
    }, {});

    onSubmit({
      formats: selectedFormats,
      sheetName: sheetName.trim() || defaultSheetName,
      cellRange: normalizedRange,
      documentOptions: {
        page: normalizedDocumentPage,
        width: normalizedDocumentWidth,
        height: normalizedDocumentHeight,
        placement: documentPlacement
      },
      templateFiles
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
            <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border bg-muted/20 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Formats</p>
                <p className="text-xs text-muted-foreground">{helperText}</p>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-medium shadow-sm transition hover:bg-muted"
                onClick={toggleSelectAll}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex h-4 w-4 items-center justify-center rounded-sm border text-[10px] leading-none',
                    allSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-background'
                  )}
                >
                  {allSelected ? <Icons.check className="h-3 w-3" /> : null}
                </span>
                Select all
              </button>
            </div>
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

            {fileBackedExportSelected && (
              <div className="mt-5 rounded-lg border bg-muted/20 p-4">
                <div className="mb-3">
                  <p className="text-sm font-semibold text-foreground">Update existing files</p>
                  <p className="text-sm text-muted-foreground">
                    Optional. Each selected document format has its own upload. Drop one file, and the backend inserts the visualization into that file.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {TEMPLATE_UPLOADS
                    .filter((upload) => upload.visibleWhen(selectedFormats))
                    .map((upload) => (
                      <div key={upload.format} className="space-y-2">
                        <Label>{upload.label}</Label>
                        <FileUpload
                          acceptedFiles={templateUploads[upload.format]}
                          updateFiles={(files) => updateTemplateUpload(upload.format, files)}
                          removeFile={(id) => removeTemplateUpload(upload.format, id)}
                          fileFormat={upload.accept}
                          maxFiles={1}
                          label={`Drag ${upload.label.toLowerCase()} here or click to browse`}
                          className={pending ? 'pointer-events-none opacity-60' : ''}
                        />
                      </div>
                    ))}
                </div>
              </div>
            )}

            {excelSelected && (
              <div className="mt-5 rounded-lg border bg-muted/20 p-4 transition-all">
                <div className="mb-3">
                  <p className="text-sm font-semibold text-foreground">Excel placement</p>
                  <p className="text-sm text-muted-foreground">
                    The visualization is placed over this exact sheet range only when Excel is selected.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-[1fr_1fr]">
                  <div className="space-y-2">
                    <Label htmlFor="export-sheet-name">Sheet</Label>
                    <Input
                      id="export-sheet-name"
                      name="sheetName"
                      value={sheetName}
                      maxLength={31}
                      disabled={pending}
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
                      disabled={pending}
                      onChange={(event) => {
                        setRangeError('');
                        setCellRange(event.target.value);
                      }}
                      placeholder="H3:Z10"
                    />
                  </div>
                </div>
                {rangeError && <p className="mt-2 text-sm font-medium text-destructive">{rangeError}</p>}
              </div>
            )}

            {documentSelected && (
              <div className="mt-5 rounded-lg border bg-muted/20 p-4">
                <div className="mb-3">
                  <p className="text-sm font-semibold text-foreground">PDF / Word / PowerPoint placement</p>
                  <p className="text-sm text-muted-foreground">
                    Used only when PDF, Word, or PowerPoint is selected. Multiple selections are generated together after Download.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="export-document-page">Page / slide</Label>
                    <Input
                      id="export-document-page"
                      type="number"
                      min={1}
                      max={200}
                      value={documentPage}
                      disabled={pending}
                      onChange={(event) => setDocumentPage(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="export-document-width">Width</Label>
                    <Input
                      id="export-document-width"
                      type="number"
                      min={120}
                      max={2400}
                      value={documentWidth}
                      disabled={pending}
                      onChange={(event) => setDocumentWidth(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="export-document-height">Height</Label>
                    <Input
                      id="export-document-height"
                      type="number"
                      min={120}
                      max={2400}
                      value={documentHeight}
                      disabled={pending}
                      onChange={(event) => setDocumentHeight(event.target.value)}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <Label>Position on page</Label>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {DOCUMENT_PLACEMENTS.map((placement) => (
                      <button
                        key={placement.value}
                        type="button"
                        disabled={pending}
                        className={cn(
                          'rounded-md border bg-background px-2 py-2 text-xs font-medium shadow-sm transition hover:border-primary/50 hover:bg-primary/[0.04]',
                          documentPlacement === placement.value && 'border-primary bg-primary/[0.08] text-primary'
                        )}
                        onClick={() => setDocumentPlacement(placement.value)}
                      >
                        {placement.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

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
              disabled={pending || selectedCount === 0}
              onClick={() => void handleDownload()}
            >
              {pending ? (
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
