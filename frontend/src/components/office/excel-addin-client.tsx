'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Script from 'next/script';
import * as echarts from 'echarts';
import 'echarts-wordcloud';
import { VisualizationTypes } from '@illustry/types';
import { useLocale } from '@/components/providers/locale-provider';

type ExcelRange = {
  address?: string;
  formulas?: unknown[][];
  height?: number;
  left?: number;
  top?: number;
  values?: unknown[][];
  width?: number;
  load: (properties: string) => void;
  worksheet?: ExcelWorksheet;
};

type ExcelShape = {
  delete: () => void;
  height?: number;
  isNullObject?: boolean;
  left?: number;
  load: (properties: string) => void;
  name?: string;
  top?: number;
  width?: number;
};

type ExcelWorksheet = {
  getRange: (address: string) => ExcelRange;
  onChanged?: {
    add: (handler: () => void) => void;
  };
  shapes?: {
    addImage: (base64Image: string) => ExcelShape;
    getItemOrNullObject: (name: string) => ExcelShape;
  };
};

type ExcelWorkbook = {
  getSelectedRange: () => ExcelRange & { worksheet?: ExcelWorksheet };
  worksheets: {
    getActiveWorksheet: () => ExcelWorksheet;
    getItem: (name: string) => ExcelWorksheet;
  };
};

type ExcelContext = {
  workbook: ExcelWorkbook;
  sync: () => Promise<void>;
};

type OfficeReadyInfo = {
  host?: string;
};

type OfficeApi = {
  HostType?: {
    Excel?: string;
  };
  onReady: (callback: (info: OfficeReadyInfo) => void) => void;
};

type ExcelApi = {
  run: <T>(callback: (context: ExcelContext) => Promise<T>) => Promise<T>;
};

type BoundRange = {
  sheetName?: string;
  rangeAddress: string;
  displayAddress: string;
};

type WorkbookBinding = {
  title?: string;
  type?: string;
  sheetName?: string;
  rangeAddress?: string;
  imageRangeAddress?: string;
  charts?: Array<{
    title?: string;
    type?: string;
    option?: echarts.EChartsCoreOption;
  }>;
};

type OfficePreview = {
  title: string;
  type: string;
  option: echarts.EChartsCoreOption;
};

declare global {
  interface Window {
    Office?: OfficeApi;
    Excel?: ExcelApi;
  }
}

const visualizationOptions = [
  { translationKey: 'viz.barChart', value: VisualizationTypes.VisualizationTypesEnum.BAR_CHART },
  { translationKey: 'viz.lineChart', value: VisualizationTypes.VisualizationTypesEnum.LINE_CHART },
  { translationKey: 'viz.pieChart', value: VisualizationTypes.VisualizationTypesEnum.PIE_CHART },
  { translationKey: 'viz.funnel', value: VisualizationTypes.VisualizationTypesEnum.FUNNEL },
  { translationKey: 'viz.scatter', value: VisualizationTypes.VisualizationTypesEnum.SCATTER },
  { translationKey: 'viz.forcedLayoutGraph', value: VisualizationTypes.VisualizationTypesEnum.FORCE_DIRECTED_GRAPH },
  { translationKey: 'viz.sankey', value: VisualizationTypes.VisualizationTypesEnum.SANKEY },
  { translationKey: 'viz.calendar', value: VisualizationTypes.VisualizationTypesEnum.CALENDAR }
];
const WORKSHEET_SHAPE_NAME = 'Illustry Live Visualization';

const parseExcelAddress = (address: string): BoundRange => {
  const separatorIndex = address.lastIndexOf('!');
  if (separatorIndex < 0) {
    return {
      rangeAddress: address,
      displayAddress: address
    };
  }

  const rawSheetName = address.slice(0, separatorIndex);
  const sheetName = rawSheetName.replace(/^'|'$/g, '').replace(/''/g, "'");
  const rangeAddress = address.slice(separatorIndex + 1);
  return {
    sheetName,
    rangeAddress,
    displayAddress: address
  };
};

const getOfficeExcel = () => {
  if (typeof window === 'undefined' || !window.Excel) {
    throw new Error('Open this add-in from Excel before binding a range.');
  }
  return window.Excel;
};

const ExcelAddinClient = () => {
  const { t } = useLocale();
  const chartElementRef = useRef<HTMLDivElement | null>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [officeReady, setOfficeReady] = useState(false);
  const [boundRange, setBoundRange] = useState<BoundRange | null>(null);
  const [placementRange, setPlacementRange] = useState<BoundRange | null>(null);
  const [chartType, setChartType] = useState(VisualizationTypes.VisualizationTypesEnum.BAR_CHART);
  const [title, setTitle] = useState(t('office.excel.defaultVisualizationTitle'));
  const [status, setStatus] = useState(t('office.excel.status.openInExcel'));
  const [isBusy, setIsBusy] = useState(false);

  const selectedTypeLabel = useMemo(
    () => t(visualizationOptions.find((option) => option.value === chartType)?.translationKey || 'form.dashboard.visualizations'),
    [chartType, t]
  );

  useEffect(() => {
    if (!chartElementRef.current || chartInstanceRef.current) {
      return undefined;
    }

    chartInstanceRef.current = echarts.init(chartElementRef.current, null, { renderer: 'svg' });
    const resizeChart = () => chartInstanceRef.current?.resize();
    const resizeObserver = new ResizeObserver(resizeChart);
    resizeObserver.observe(chartElementRef.current);
    window.addEventListener('resize', resizeChart);

    return () => {
      window.removeEventListener('resize', resizeChart);
      resizeObserver.disconnect();
      chartInstanceRef.current?.dispose();
      chartInstanceRef.current = null;
    };
  }, []);

  const applyPreview = (preview: OfficePreview) => {
    if (!chartInstanceRef.current) {
      return;
    }

    chartInstanceRef.current.setOption(preview.option, true);
    requestAnimationFrame(() => chartInstanceRef.current?.resize());
  };

  const applyInitialOption = (option: echarts.EChartsCoreOption | undefined) => {
    if (!option || !chartInstanceRef.current) {
      return;
    }

    chartInstanceRef.current.setOption(option, true);
    requestAnimationFrame(() => chartInstanceRef.current?.resize());
  };

  const getCurrentChartPngBase64 = async () => {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const dataUrl = chartInstanceRef.current?.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      excludeComponents: ['toolbox']
    });
    const base64 = dataUrl?.split(',')[1];
    return base64 || undefined;
  };

  const updateWorksheetImage = async (targetRange = placementRange || boundRange) => {
    if (!targetRange) {
      return;
    }

    const imageBase64 = await getCurrentChartPngBase64();
    if (!imageBase64) {
      return;
    }

    const excel = getOfficeExcel();
    await excel.run(async (context) => {
      const worksheet = targetRange.sheetName
        ? context.workbook.worksheets.getItem(targetRange.sheetName)
        : context.workbook.worksheets.getActiveWorksheet();
      if (!worksheet.shapes) {
        return;
      }

      const range = worksheet.getRange(targetRange.rangeAddress);
      range.load('left, top, width, height');
      const existingShape = worksheet.shapes.getItemOrNullObject(WORKSHEET_SHAPE_NAME);
      existingShape.load('isNullObject');
      await context.sync();

      if (!existingShape.isNullObject) {
        existingShape.delete();
      }

      const shape = worksheet.shapes.addImage(imageBase64);
      shape.name = WORKSHEET_SHAPE_NAME;
      shape.left = range.left || 0;
      shape.top = range.top || 0;
      shape.width = range.width || 640;
      shape.height = range.height || 360;
      await context.sync();
    });
  };

  const renderRange = async (range: ExcelRange) => {
    const values = Array.isArray(range.values) ? range.values : [];
    const formulas = Array.isArray(range.formulas) ? range.formulas : [];
    const response = await fetch('/api/office/visualization/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: chartType,
        title: title || selectedTypeLabel,
        values,
        formulas
      })
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.error || `Preview failed with status ${response.status}`);
    }
    applyPreview(payload as OfficePreview);
  };

  const readEmbeddedBinding = async () => {
    const excel = getOfficeExcel();
    try {
      let nextPlacementRange: BoundRange | null = null;
      await excel.run(async (context) => {
        const metadataRange = context.workbook.worksheets.getItem('Illustry Add-in').getRange('A1');
        metadataRange.load('values');
        await context.sync();
        const rawMetadata = metadataRange.values?.[0]?.[0];
        if (typeof rawMetadata !== 'string' || rawMetadata.trim() === '') {
          return;
        }

        const metadata = JSON.parse(rawMetadata) as WorkbookBinding;
        const imageRangeAddress = metadata.imageRangeAddress || metadata.rangeAddress;
        if (!imageRangeAddress) {
          return;
        }

        nextPlacementRange = {
          sheetName: metadata.sheetName,
          rangeAddress: imageRangeAddress,
          displayAddress: metadata.sheetName ? `${metadata.sheetName}!${imageRangeAddress}` : imageRangeAddress
        };
        if (metadata.title) {
          setTitle(metadata.title);
        }
        if (metadata.type && visualizationOptions.some((option) => option.value === metadata.type)) {
          setChartType(metadata.type as VisualizationTypes.VisualizationTypesEnum);
        }
        setPlacementRange(nextPlacementRange);
        const initialChart = metadata.charts?.[0];
        if (initialChart?.type && visualizationOptions.some((option) => option.value === initialChart.type)) {
          setChartType(initialChart.type as VisualizationTypes.VisualizationTypesEnum);
        }
        applyInitialOption(initialChart?.option);
        setStatus(t('office.excel.status.visualizationPlaced').replace('{range}', nextPlacementRange.displayAddress));
      });
      if (nextPlacementRange) {
        await updateWorksheetImage(nextPlacementRange);
      }
    } catch {
      setStatus(t('office.excel.status.selectRange'));
    }
  };

  const refreshBoundRange = async (nextRange = boundRange) => {
    if (!nextRange) {
      return;
    }

    const excel = getOfficeExcel();
    setIsBusy(true);
    try {
      await excel.run(async (context) => {
        const worksheet = nextRange.sheetName
          ? context.workbook.worksheets.getItem(nextRange.sheetName)
          : context.workbook.worksheets.getActiveWorksheet();
        const range = worksheet.getRange(nextRange.rangeAddress);
        range.load('address, values, formulas');
        await context.sync();
        await renderRange(range);
      });
      await updateWorksheetImage(placementRange || nextRange);
      setStatus(t('office.excel.status.liveFrom').replace('{range}', nextRange.displayAddress));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : t('office.excel.status.refreshFailed'));
    } finally {
      setIsBusy(false);
    }
  };

  const scheduleRefresh = (nextRange = boundRange) => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }
    refreshTimerRef.current = setTimeout(() => {
      void refreshBoundRange(nextRange);
    }, 180);
  };

  const bindSelectedRange = async () => {
    const excel = getOfficeExcel();
    setIsBusy(true);
    try {
      let imageRangeToUpdate: BoundRange | null = null;
      await excel.run(async (context) => {
        const range = context.workbook.getSelectedRange();
        range.load('address, values, formulas');
        await context.sync();
        const nextRange = parseExcelAddress(range.address || '');
        setBoundRange(nextRange);
        await renderRange(range);
        imageRangeToUpdate = placementRange || nextRange;
        range.worksheet?.onChanged?.add(() => scheduleRefresh(nextRange));
        await context.sync();
        setStatus(t('office.excel.status.boundTo').replace('{range}', nextRange.displayAddress));
      });
      if (imageRangeToUpdate) {
        await updateWorksheetImage(imageRangeToUpdate);
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : t('office.excel.status.bindFailed'));
    } finally {
      setIsBusy(false);
    }
  };

  const handleOfficeScriptReady = () => {
    window.Office?.onReady((info) => {
      const excelHost = window.Office?.HostType?.Excel || 'Excel';
      const ready = info.host === excelHost || info.host === 'Excel';
      setOfficeReady(ready);
      setStatus(ready
        ? t('office.excel.status.selectRange')
        : t('office.excel.status.excelOnly'));
      if (ready) {
        void readEmbeddedBinding();
      }
    });
  };

  useEffect(() => {
    if (boundRange) {
      scheduleRefresh(boundRange);
    }
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [chartType, title]);

  return (
    <main className="flex h-screen min-h-[420px] flex-col bg-[#f8fafc] text-slate-900">
      <Script
        src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js"
        strategy="afterInteractive"
        onLoad={handleOfficeScriptReady}
      />
      <section className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{t('office.excel.title')}</p>
          <p className="truncate text-xs text-slate-500">{status}</p>
        </div>
        <button
          type="button"
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!officeReady || isBusy}
          onClick={() => void bindSelectedRange()}
        >
          {isBusy ? t('office.excel.syncing') : t('office.excel.bindSelectedRange')}
        </button>
      </section>

      <section className="grid min-h-0 flex-1 grid-cols-[280px_minmax(0,1fr)] gap-0">
        <aside className="border-r border-slate-200 bg-white p-4">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="office-chart-title">
            {t('office.excel.field.title')}
          </label>
          <input
            id="office-chart-title"
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-700"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />

          <label className="mt-5 block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="office-chart-type">
            {t('office.excel.field.visualization')}
          </label>
          <select
            id="office-chart-type"
            className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-700"
            value={chartType}
            onChange={(event) => setChartType(event.target.value as VisualizationTypes.VisualizationTypesEnum)}
          >
            {visualizationOptions.map((option) => (
              <option key={option.value} value={option.value}>{t(option.translationKey)}</option>
            ))}
          </select>

          <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
            <p className="font-semibold text-slate-800">{t('office.excel.expectedRangeShapes')}</p>
            <p>{t('office.excel.shape.axis')}</p>
            <p>{t('office.excel.shape.value')}</p>
            <p>{t('office.excel.shape.network')}</p>
            <p>{t('office.excel.shape.scatter')}</p>
          </div>
        </aside>

        <section className="min-h-0 p-4">
          <div className="h-full min-h-[320px] rounded-lg border border-slate-200 bg-white shadow-sm">
            <div ref={chartElementRef} className="h-full w-full" />
          </div>
        </section>
      </section>
    </main>
  );
};

export default ExcelAddinClient;
