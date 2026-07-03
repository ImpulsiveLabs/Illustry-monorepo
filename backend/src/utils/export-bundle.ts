import { DashboardTypes, VisualizationTypes } from '@illustry/types';
import * as echarts from 'echarts';
import JSZip from 'jszip';
import sharp from 'sharp';
import {
  createPdfExport,
  createPptExport,
  createWordExport,
  getTemplateFileKind,
  type DocumentExportOptions
} from './document-export';
import { createDashboardExcelWorkbook, createVisualizationExcelWorkbook } from './excel-export';

type ExportFormat = 'png' | 'jpg' | 'webp' | 'svg' | 'web-component' | 'excel' | 'pdf' | 'word' | 'ppt';

const toZipBytes = (buffer: Buffer) => new Uint8Array(buffer);

type ExportChartPayload = {
  title?: string;
  option: unknown;
  width?: number;
  height?: number;
  previewDataUrl?: string;
};

type BundleExcelOptions = {
  sheetName?: string;
  cellRange?: string;
  templateWorkbookBase64?: string;
  templateWorkbookBuffer?: Buffer;
  templateWorkbookFilename?: string;
};

type CreateVisualizationBundleInput = {
  title: string;
  formats: ExportFormat[];
  charts: ExportChartPayload[];
  previewDataUrl?: string;
  excelOptions?: BundleExcelOptions;
  documentOptions?: DocumentExportOptions;
  visualization: VisualizationTypes.VisualizationType;
};

type CreateDashboardBundleInput = {
  title: string;
  formats: ExportFormat[];
  charts: ExportChartPayload[];
  previewDataUrl?: string;
  excelOptions?: BundleExcelOptions;
  documentOptions?: DocumentExportOptions;
  dashboard: DashboardTypes.DashboardType;
};

type ExportFile = {
  buffer: Buffer;
  filename: string;
  mimeType: string;
};

type ExportBundleResult = ExportFile & {
  bundled: boolean;
};

const EXPORT_BACKGROUND = '#ffffff';
const MAX_EXPORT_FORMATS = 9;
const DEFAULT_CHART_WIDTH = 1280;
const DEFAULT_CHART_HEIGHT = 720;
const DASHBOARD_CONNECTED_PREVIEW_GAP = 29;
const DASHBOARD_CONNECTED_PREVIEW_HEIGHT_RATIO = 0.544;
const ZIP_MIME = 'application/zip';
const ECHARTS_CDN_URL = 'https://cdn.jsdelivr.net/npm/echarts@6/dist/echarts.min.js';
const ECHARTS_WORDCLOUD_CDN_URL = 'https://cdn.jsdelivr.net/npm/echarts-wordcloud@2/dist/echarts-wordcloud.min.js';

const mimeByFormat: Record<Exclude<ExportFormat, 'web-component' | 'excel' | 'pdf' | 'word' | 'ppt'>, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  webp: 'image/webp',
  svg: 'image/svg+xml;charset=utf-8'
};

const sanitizeFilename = (value: string) => value
  .trim()
  .replace(/[/\\?%*:|"<>]/g, '-')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '')
  || 'illustry-export';

const svgEscape = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/"/g, '&quot;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

const escapeScriptJson = (value: string) => value
  .replace(/</g, '\\u003c')
  .replace(/>/g, '\\u003e')
  .replace(/&/g, '\\u0026')
  .replace(/\u2028/g, '\\u2028')
  .replace(/\u2029/g, '\\u2029');

const serializeForWebComponent = (value: unknown) => JSON.stringify(value, (_key, item) => {
  if (typeof item === 'function') {
    return undefined;
  }
  return item;
});

const reviveExportOption = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(reviveExportOption);
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (typeof record.__illustryFunction === 'string') {
      return undefined;
    }
    return Object.fromEntries(
      Object.entries(record).map(([key, item]) => [key, reviveExportOption(item)])
    );
  }
  return value;
};

const normalizeDimension = (value: unknown, fallback: number, min: number, max: number) => {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, Math.round(numberValue)));
};

const normalizeFormats = (formats: unknown): ExportFormat[] => {
  if (!Array.isArray(formats)) {
    throw new Error('Select at least one export option.');
  }
  const supported = new Set<ExportFormat>(['png', 'jpg', 'webp', 'svg', 'web-component', 'excel', 'pdf', 'word', 'ppt']);
  const normalized = Array.from(new Set(
    formats.filter((format): format is ExportFormat => typeof format === 'string' && supported.has(format as ExportFormat))
  ));
  if (normalized.length === 0) {
    throw new Error('Select at least one export option.');
  }
  if (normalized.length > MAX_EXPORT_FORMATS) {
    throw new Error('Too many export options were selected.');
  }
  return normalized;
};

const normalizeCharts = (charts: unknown): Required<ExportChartPayload>[] => {
  if (!Array.isArray(charts)) {
    throw new Error('No visualization data was provided for export.');
  }
  const normalized = charts
    .filter((chart): chart is ExportChartPayload => Boolean(chart) && typeof chart === 'object' && 'option' in chart)
    .map((chart, index) => ({
      title: chart.title || `Visualization ${index + 1}`,
      option: reviveExportOption(chart.option),
      width: normalizeDimension(chart.width, DEFAULT_CHART_WIDTH, 240, 4096),
      height: normalizeDimension(chart.height, DEFAULT_CHART_HEIGHT, 180, 4096),
      previewDataUrl: typeof chart.previewDataUrl === 'string' ? chart.previewDataUrl : ''
    }));
  if (normalized.length === 0) {
    throw new Error('No visualization data was provided for export.');
  }
  return normalized;
};

const previewDataUrlToPng = (value?: string) => {
  if (!value) {
    return undefined;
  }
  const matched = value.match(/^data:image\/png;base64,([A-Za-z0-9+/=]+)$/);
  if (!matched?.[1]) {
    return undefined;
  }
  const buffer = Buffer.from(matched[1], 'base64');
  return buffer.length ? buffer : undefined;
};

const renderChartSvg = (chart: Required<ExportChartPayload>) => {
  const instance = echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width: chart.width,
    height: chart.height
  });
  try {
    instance.setOption(chart.option as echarts.EChartsOption, true);
    return instance.renderToSVGString();
  } finally {
    instance.dispose();
  }
};

const stripSvgEnvelope = (svg: string) => svg
  .replace(/<\?xml[^>]*>/g, '')
  .replace(/<!DOCTYPE[^>]*>/g, '')
  .replace(/^\s*<svg\b[^>]*>/i, '')
  .replace(/<\/svg>\s*$/i, '');

const getSvgDimensions = (svg: string) => {
  const width = Number(svg.match(/\bwidth="([^"]+)"/)?.[1]);
  const height = Number(svg.match(/\bheight="([^"]+)"/)?.[1]);
  return Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0
    ? { width, height }
    : undefined;
};

const applyDefaultDocumentSize = (
  svg: string,
  options?: DocumentExportOptions
): DocumentExportOptions | undefined => {
  const dimensions = getSvgDimensions(svg);
  if (!dimensions) return options;
  if (options?.width && options?.height) return options;
  const width = options?.width || 960;
  const height = options?.height || Math.max(120, Math.round((width * dimensions.height) / dimensions.width));
  return {
    ...options,
    width,
    height
  };
};

const renderSvg = (charts: Required<ExportChartPayload>[], title: string) => {
  if (charts.length === 1) {
    return renderChartSvg(charts[0]);
  }

  const columns = charts.length <= 2 ? charts.length : Math.min(3, Math.ceil(Math.sqrt(charts.length)));
  const rows = Math.ceil(charts.length / columns);
  const cardWidth = Math.max(480, Math.max(...charts.map((chart) => chart.width)));
  const cardHeight = Math.max(320, Math.max(...charts.map((chart) => chart.height)));
  const gap = 28;
  const titleHeight = 52;
  const width = (columns * cardWidth) + ((columns + 1) * gap);
  const height = titleHeight + (rows * cardHeight) + ((rows + 1) * gap);

  const renderedCharts = charts.map((chart, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = gap + column * (cardWidth + gap);
    const y = titleHeight + gap + row * (cardHeight + gap);
    const svgBody = stripSvgEnvelope(renderChartSvg({ ...chart, width: cardWidth, height: cardHeight }));
    return [
      `<g transform="translate(${x} ${y})">`,
      `<rect width="${cardWidth}" height="${cardHeight}" rx="8" fill="#fff" stroke="#e5e7eb"/>`,
      `<svg width="${cardWidth}" height="${cardHeight}" viewBox="0 0 ${cardWidth} ${cardHeight}">${svgBody}</svg>`,
      '</g>'
    ].join('');
  }).join('');

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">`,
    `<title>${svgEscape(title)}</title>`,
    `<rect width="100%" height="100%" fill="${EXPORT_BACKGROUND}"/>`,
    `<text x="${gap}" y="34" fill="#111827" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="700">${svgEscape(title)}</text>`,
    renderedCharts,
    '</svg>'
  ].join('');
};

const getDashboardConnectedPreviewChartHeight = (charts: Required<ExportChartPayload>[]) => {
  const tallest = Math.max(...charts.map((chart) => chart.height));
  return Math.max(120, Math.round(tallest * DASHBOARD_CONNECTED_PREVIEW_HEIGHT_RATIO));
};

const renderDashboardConnectedPreviewSvg = (charts: Required<ExportChartPayload>[]) => {
  if (charts.length === 1) {
    return renderChartSvg(charts[0]);
  }

  const columns = charts.length <= 2 ? charts.length : Math.min(3, Math.ceil(Math.sqrt(charts.length)));
  const rows = Math.ceil(charts.length / columns);
  const chartWidth = Math.max(...charts.map((chart) => chart.width));
  const chartHeight = getDashboardConnectedPreviewChartHeight(charts);
  const width = (columns * chartWidth) + ((columns - 1) * DASHBOARD_CONNECTED_PREVIEW_GAP);
  const height = (rows * chartHeight) + ((rows - 1) * DASHBOARD_CONNECTED_PREVIEW_GAP);

  const renderedCharts = charts.map((chart, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = column * (chartWidth + DASHBOARD_CONNECTED_PREVIEW_GAP);
    const y = row * (chartHeight + DASHBOARD_CONNECTED_PREVIEW_GAP);
    const svgBody = stripSvgEnvelope(renderChartSvg({ ...chart, width: chartWidth, height: chartHeight }));
    return [
      `<g transform="translate(${x} ${y})">`,
      `<svg width="${chartWidth}" height="${chartHeight}" viewBox="0 0 ${chartWidth} ${chartHeight}">${svgBody}</svg>`,
      '</g>'
    ].join('');
  }).join('');

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">`,
    '<title>Dashboard preview</title>',
    `<rect width="100%" height="100%" fill="${EXPORT_BACKGROUND}"/>`,
    renderedCharts,
    '</svg>'
  ].join('');
};

const getFallbackPreviewSvg = (
  kind: 'visualization' | 'dashboard',
  charts: Required<ExportChartPayload>[],
  svg: string
) => (kind === 'dashboard' && charts.length > 1
  ? renderDashboardConnectedPreviewSvg(charts)
  : svg);

const encodeRaster = async (image: sharp.Sharp, format: 'png' | 'jpg' | 'webp') => {
  const flattened = image.flatten({ background: EXPORT_BACKGROUND });
  if (format === 'jpg') {
    return flattened.jpeg({ quality: 95 }).toBuffer();
  }
  if (format === 'webp') {
    return flattened.webp({ quality: 95 }).toBuffer();
  }
  return flattened.png({ compressionLevel: 9 }).toBuffer();
};

const rasterizeSvg = async (svg: string, format: 'png' | 'jpg' | 'webp') => {
  return encodeRaster(sharp(Buffer.from(svg), { density: 144 }), format);
};

const rasterizePreview = async (
  previewPng: Buffer | undefined,
  svg: string,
  format: 'png' | 'jpg' | 'webp'
) => {
  if (previewPng?.length) {
    return encodeRaster(sharp(previewPng), format);
  }
  return rasterizeSvg(svg, format);
};

const buildWebComponentHtml = (
  kind: 'visualization' | 'dashboard',
  title: string,
  charts: Required<ExportChartPayload>[]
) => {
  const elementName = kind === 'dashboard' ? 'illustry-dashboard' : 'illustry-visualization';
  const payloadJson = escapeScriptJson(serializeForWebComponent({
    kind,
    title,
    charts: charts.map((chart) => ({ title: chart.title, option: chart.option }))
  }));

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${svgEscape(title)}</title>
</head>
<body>
  <!-- Drop this element and the script below into any HTML page. -->
  <${elementName}></${elementName}>
  <script type="application/json" id="illustry-web-component-data">${payloadJson}</script>
  <script>
(() => {
  const dataElement = document.getElementById('illustry-web-component-data');
  const payload = JSON.parse(dataElement.textContent || '{}');
  const loadScript = (src) => new Promise((resolve, reject) => {
    const existing = Array.from(document.scripts).find((script) => script.src === src);
    if (existing) { resolve(); return; }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Unable to load ' + src));
    document.head.appendChild(script);
  });
  const revive = (value) => {
    if (Array.isArray(value)) {
      return value.map(revive);
    }
    if (value && typeof value === 'object') {
      if (typeof value.__illustryFunction === 'string') {
        return undefined;
      }
      Object.keys(value).forEach((key) => {
        value[key] = revive(value[key]);
      });
    }
    return value;
  };
  const ensureECharts = async () => {
    if (!window.echarts) {
      await loadScript('${ECHARTS_CDN_URL}');
    }
    const needsWordCloud = JSON.stringify(payload).includes('"wordCloud"');
    if (needsWordCloud) {
      await loadScript('${ECHARTS_WORDCLOUD_CDN_URL}').catch(() => undefined);
    }
  };
  class IllustryVisualizationElement extends HTMLElement {
    connectedCallback() {
      void this.render();
    }

    disconnectedCallback() {
      this.resizeObserver?.disconnect();
      this.charts?.forEach((chart) => chart.dispose());
    }

    async render() {
      await ensureECharts();
      const charts = Array.isArray(payload.charts) ? payload.charts : [];
      const isDashboard = payload.kind === 'dashboard';
      const root = this.shadowRoot || this.attachShadow({ mode: 'open' });
      root.innerHTML = '<style>' +
        ':host{display:block;width:100%;min-height:' + (isDashboard ? '640px' : '420px') + ';font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#1f2937}' +
        '.wrap{box-sizing:border-box;width:100%;height:100%;min-height:inherit;border:1px solid #e5e7eb;border-radius:10px;background:#fff;padding:12px;box-shadow:0 8px 24px rgba(15,23,42,.08)}' +
        '.title{margin:0 0 10px;font-size:15px;font-weight:700;line-height:1.2}' +
        '.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;height:calc(100% - 28px);min-height:580px}' +
        '.card{box-sizing:border-box;min-height:280px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;background:#fff;padding:10px}' +
        '.chart-title{height:24px;margin:0;text-align:center;font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
        '.chart{width:100%;height:' + (isDashboard ? 'calc(100% - 28px)' : '100%') + ';min-height:' + (isDashboard ? '240px' : '380px') + '}' +
        '</style><section class="wrap"><h2 class="title"></h2><div class="mount"></div></section>';
      root.querySelector('.title').textContent = payload.title || 'Illustry export';
      const mount = root.querySelector('.mount');
      mount.className = isDashboard ? 'grid' : 'mount';
      mount.innerHTML = '';
      this.charts = charts.map((chartConfig, index) => {
        const host = document.createElement(isDashboard ? 'article' : 'div');
        host.className = isDashboard ? 'card' : '';
        if (isDashboard) {
          const title = document.createElement('h3');
          title.className = 'chart-title';
          title.textContent = chartConfig.title || ('Visualization ' + (index + 1));
          host.appendChild(title);
        }
        const chartElement = document.createElement('div');
        chartElement.className = 'chart';
        host.appendChild(chartElement);
        mount.appendChild(host);
        const chart = window.echarts.init(chartElement, null, { renderer: this.getAttribute('renderer') || 'svg' });
        chart.setOption(revive(chartConfig.option || {}), true);
        return chart;
      });
      this.resizeObserver?.disconnect();
      this.resizeObserver = new ResizeObserver(() => this.charts?.forEach((chart) => chart.resize()));
      this.resizeObserver.observe(this);
      requestAnimationFrame(() => this.charts?.forEach((chart) => chart.resize()));
    }
  }
  if (!customElements.get('${elementName}')) {
    customElements.define('${elementName}', IllustryVisualizationElement);
  }
})();
  </script>
</body>
</html>`;
};
const verifyZipIntegrity = async (buffer: Buffer, files: ExportFile[]) => {
  const zip = await JSZip.loadAsync(toZipBytes(buffer));
  await Promise.all(files.map(async (file) => {
    const entry = zip.file(file.filename);
    if (!entry) {
      throw new Error(`ZIP integrity check failed: ${file.filename} is missing.`);
    }
    const content = await entry.async('nodebuffer');
    if (content.length === 0) {
      throw new Error(`ZIP integrity check failed: ${file.filename} is empty.`);
    }
    if (file.filename.endsWith('.xlsx')) {
      await JSZip.loadAsync(toZipBytes(content));
    }
    if (file.filename.endsWith('.docx')) {
      await JSZip.loadAsync(toZipBytes(content));
    }
    if (file.filename.endsWith('.pptx')) {
      await JSZip.loadAsync(toZipBytes(content));
    }
    if (file.filename.endsWith('.pdf') && !content.subarray(0, 5).equals(Buffer.from('%PDF-'))) {
      throw new Error(`ZIP integrity check failed: ${file.filename} is not a valid PDF.`);
    }
  }));
};

const zipFiles = async (files: ExportFile[], filename: string): Promise<ExportBundleResult> => {
  const zip = new JSZip();
  files.forEach((file) => {
    zip.file(file.filename, toZipBytes(file.buffer), {
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    });
  });
  const buffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
    streamFiles: true
  });
  await verifyZipIntegrity(buffer, files);
  return {
    buffer,
    filename: `${sanitizeFilename(filename)}.zip`,
    mimeType: ZIP_MIME,
    bundled: true
  };
};

const bundleFiles = async (files: ExportFile[], title: string): Promise<ExportBundleResult> => {
  if (files.length === 0) {
    throw new Error('No export files were generated.');
  }
  if (files.length === 1) {
    return { ...files[0], bundled: false };
  }
  return zipFiles(files, title);
};

const createFiles = async ({
  kind,
  title,
  formats,
  charts,
  previewDataUrl,
  documentOptions,
  createExcel
}: {
  kind: 'visualization' | 'dashboard';
  title: string;
  formats: ExportFormat[];
  charts: Required<ExportChartPayload>[];
  previewDataUrl?: string;
  documentOptions?: DocumentExportOptions;
  createExcel?: (previewPng: Buffer, charts: Required<ExportChartPayload>[]) => Promise<ExportFile>;
}) => {
  const safeTitle = sanitizeFilename(title);
  const svg = renderSvg(charts, title);
  const fallbackPreviewSvg = getFallbackPreviewSvg(kind, charts, svg);
  const sizedDocumentOptions = applyDefaultDocumentSize(fallbackPreviewSvg, documentOptions);
  const templateFileKind = getTemplateFileKind(documentOptions?.templateFile);
  const getTemplateFileFor = (format: 'excel' | 'pdf' | 'word' | 'ppt') => (
    documentOptions?.templateFiles?.[format]
    || (templateFileKind === format ? documentOptions?.templateFile : undefined)
  );
  let previewPng: Buffer | undefined = previewDataUrlToPng(previewDataUrl)
    ?? previewDataUrlToPng(charts[0]?.previewDataUrl);
  const getPreviewPng = async () => {
    previewPng ??= await rasterizeSvg(fallbackPreviewSvg, 'png');
    return previewPng;
  };

  return Promise.all(formats.map(async (format): Promise<ExportFile> => {
    if (format === 'svg') {
      return {
        buffer: Buffer.from(svg),
        filename: `${safeTitle}.svg`,
        mimeType: mimeByFormat.svg
      };
    }
    if (format === 'web-component') {
      return {
        buffer: Buffer.from(buildWebComponentHtml(kind, title, charts)),
        filename: `${safeTitle}.webcomponent.html`,
        mimeType: 'text/html;charset=utf-8'
      };
    }
    if (format === 'excel') {
      if (!createExcel) {
        throw new Error('Excel export is not available for this resource.');
      }
      return createExcel(await getPreviewPng(), charts);
    }
    if (format === 'pdf') {
      const templateFile = getTemplateFileFor('pdf');
      return createPdfExport({
        title: safeTitle,
        image: await getPreviewPng(),
        options: { ...sizedDocumentOptions, templateFile }
      });
    }
    if (format === 'word') {
      const templateFile = getTemplateFileFor('word');
      return createWordExport({
        title: safeTitle,
        image: await getPreviewPng(),
        options: { ...sizedDocumentOptions, templateFile }
      });
    }
    if (format === 'ppt') {
      const templateFile = getTemplateFileFor('ppt');
      return createPptExport({
        title: safeTitle,
        image: await getPreviewPng(),
        options: { ...sizedDocumentOptions, templateFile }
      });
    }
    return {
      buffer: await rasterizePreview(previewPng, fallbackPreviewSvg, format),
      filename: `${safeTitle}.${format}`,
      mimeType: mimeByFormat[format]
    };
  }));
};

const createVisualizationExportBundle = async ({
  title,
  formats,
  charts,
  previewDataUrl,
  excelOptions,
  documentOptions,
  visualization
}: CreateVisualizationBundleInput): Promise<ExportBundleResult> => {
  const normalizedFormats = normalizeFormats(formats);
  const normalizedCharts = normalizeCharts(charts);
  const files = await createFiles({
    kind: 'visualization',
    title,
    formats: normalizedFormats,
    charts: normalizedCharts,
    previewDataUrl,
    documentOptions,
    createExcel: async (previewPng, excelCharts) => {
      const templateFileKind = getTemplateFileKind(documentOptions?.templateFile);
      const excelTemplateFile = documentOptions?.templateFiles?.excel
        || (templateFileKind === 'excel' ? documentOptions?.templateFile : undefined);
      const workbook = await createVisualizationExcelWorkbook(visualization, {
        ...excelOptions,
        templateWorkbookBuffer: excelTemplateFile?.buffer,
        templateWorkbookFilename: excelTemplateFile
          ? excelTemplateFile.originalname
          : excelOptions?.templateWorkbookFilename,
        embeddedCharts: excelCharts.map((chart) => ({
          title: chart.title,
          type: Array.isArray(visualization.type) ? visualization.type[0] : visualization.type,
          option: chart.option
        })),
        previewImage: {
          buffer: previewPng,
          extension: 'png'
        }
      });
      return {
        buffer: workbook.buffer,
        filename: workbook.filename,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      };
    }
  });
  return bundleFiles(files, title);
};

const createDashboardExportBundle = async ({
  title,
  formats,
  charts,
  previewDataUrl,
  excelOptions,
  documentOptions,
  dashboard
}: CreateDashboardBundleInput): Promise<ExportBundleResult> => {
  const normalizedFormats = normalizeFormats(formats);
  const normalizedCharts = normalizeCharts(charts);
  const dashboardVisualizations = Array.isArray(dashboard.visualizations)
    ? dashboard.visualizations
    : [];
  const files = await createFiles({
    kind: 'dashboard',
    title,
    formats: normalizedFormats,
    charts: normalizedCharts,
    previewDataUrl,
    documentOptions,
    createExcel: async (previewPng, excelCharts) => {
      const templateFileKind = getTemplateFileKind(documentOptions?.templateFile);
      const excelTemplateFile = documentOptions?.templateFiles?.excel
        || (templateFileKind === 'excel' ? documentOptions?.templateFile : undefined);
      const workbook = await createDashboardExcelWorkbook(dashboard, {
        ...excelOptions,
        templateWorkbookBuffer: excelTemplateFile?.buffer,
        templateWorkbookFilename: excelTemplateFile
          ? excelTemplateFile.originalname
          : excelOptions?.templateWorkbookFilename,
        embeddedCharts: excelCharts.map((chart, index) => ({
          title: chart.title,
          type: Array.isArray(dashboardVisualizations[index]?.type)
            ? dashboardVisualizations[index].type[0]
            : dashboardVisualizations[index]?.type,
          option: chart.option
        })),
        previewImage: {
          buffer: previewPng,
          extension: 'png'
        }
      });
      return {
        buffer: workbook.buffer,
        filename: workbook.filename,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      };
    }
  });
  return bundleFiles(files, title);
};

export {
  createDashboardExportBundle,
  createVisualizationExportBundle,
  normalizeFormats,
  normalizeCharts
};
export type {
  BundleExcelOptions,
  ExportBundleResult,
  ExportChartPayload,
  ExportFormat
};
