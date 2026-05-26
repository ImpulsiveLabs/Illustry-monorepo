import {
  AlignmentType,
  Document,
  ImageRun,
  Packer,
  Paragraph
} from 'docx';
import * as echarts from 'echarts';
import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import PptxGenJS from 'pptxgenjs';
import sharp from 'sharp';
import { IllustryError } from './errors';
import { sanitizeFilename } from './local-store';
import type {
  IllustryChartPayload,
  IllustryExportBundle,
  IllustryExportFile,
  IllustryExportFormat,
  IllustryLocalAsset
} from './types';

type LocalExportInput = {
  asset: IllustryLocalAsset;
  formats: IllustryExportFormat[];
};

const EXPORT_BACKGROUND = '#ffffff';
const DEFAULT_CHART_WIDTH = 1280;
const DEFAULT_CHART_HEIGHT = 720;
const ZIP_MIME = 'application/zip';
const ECHARTS_CDN_URL = 'https://cdn.jsdelivr.net/npm/echarts@6/dist/echarts.min.js';
const WORDCLOUD_CDN_URL = 'https://cdn.jsdelivr.net/npm/echarts-wordcloud@2/dist/echarts-wordcloud.min.js';

const mimeByFormat: Record<Exclude<IllustryExportFormat, 'json' | 'web-component' | 'excel' | 'pdf' | 'word' | 'ppt'>, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  webp: 'image/webp',
  svg: 'image/svg+xml;charset=utf-8'
};

const supportedFormats: ReadonlySet<string> = new Set([
  'json',
  'png',
  'jpg',
  'webp',
  'svg',
  'web-component',
  'excel',
  'pdf',
  'word',
  'ppt'
]);

const isIllustryExportFormat = (format: string): format is IllustryExportFormat => (
  supportedFormats.has(format)
);

const parseExportFormats = (value?: string) => {
  if (!value) {
    return ['json'] satisfies IllustryExportFormat[];
  }
  return value
    .split(',')
    .map((format) => format.trim())
    .filter(isIllustryExportFormat);
};

const normalizeFormats = (formats: string[]) => {
  const normalized = Array.from(new Set(formats.filter(isIllustryExportFormat)));
  if (normalized.length === 0) {
    throw new IllustryError('Select at least one export option.', {
      code: 'ILLUSTRY_EXPORT_EMPTY_SELECTION',
      status: 400
    });
  }
  return normalized;
};

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

const normalizeDimension = (value: unknown, fallback: number, min: number, max: number) => {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, Math.round(numberValue)));
};

const normalizeCharts = (asset: IllustryLocalAsset): Required<IllustryChartPayload>[] => {
  const charts = Array.isArray(asset.charts) ? asset.charts : [];
  const normalized = charts
    .filter((chart) => chart && typeof chart.option === 'object')
    .map((chart, index) => ({
      title: chart.title || `${asset.name} ${index + 1}`,
      option: chart.option,
      width: normalizeDimension(chart.width, DEFAULT_CHART_WIDTH, 240, 4096),
      height: normalizeDimension(chart.height, DEFAULT_CHART_HEIGHT, 180, 4096)
    }));
  if (normalized.length === 0) {
    throw new IllustryError('No chart data is available for export.', {
      code: 'ILLUSTRY_EXPORT_NO_CHARTS',
      status: 400
    });
  }
  return normalized;
};

const renderChartSvg = (chart: Required<IllustryChartPayload>) => {
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

const renderSvg = (asset: IllustryLocalAsset, charts: Required<IllustryChartPayload>[]) => {
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
    `<title>${svgEscape(asset.name)}</title>`,
    `<rect width="100%" height="100%" fill="${EXPORT_BACKGROUND}"/>`,
    `<text x="${gap}" y="34" fill="#111827" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="700">${svgEscape(asset.name)}</text>`,
    renderedCharts,
    '</svg>'
  ].join('');
};

const encodeRaster = async (svg: string, format: 'png' | 'jpg' | 'webp') => {
  const image = sharp(Buffer.from(svg), { density: 144 }).flatten({ background: EXPORT_BACKGROUND });
  if (format === 'jpg') {
    return image.jpeg({ quality: 95 }).toBuffer();
  }
  if (format === 'webp') {
    return image.webp({ quality: 95 }).toBuffer();
  }
  return image.png({ compressionLevel: 9 }).toBuffer();
};

const buildWebComponentHtml = (asset: IllustryLocalAsset, charts: Required<IllustryChartPayload>[]) => {
  const elementName = asset.kind === 'dashboard' ? 'illustry-dashboard' : 'illustry-visualization';
  const payload = escapeScriptJson(JSON.stringify({
    kind: asset.kind,
    title: asset.name,
    charts: charts.map((chart) => ({ title: chart.title, option: chart.option }))
  }));

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${svgEscape(asset.name)}</title>
</head>
<body>
  <${elementName}></${elementName}>
  <script type="application/json" id="illustry-web-component-data">${payload}</script>
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
  const ensureECharts = async () => {
    if (!window.echarts) await loadScript('${ECHARTS_CDN_URL}');
    if (JSON.stringify(payload).includes('"wordCloud"')) await loadScript('${WORDCLOUD_CDN_URL}').catch(() => undefined);
  };
  class IllustryElement extends HTMLElement {
    connectedCallback() { void this.render(); }
    disconnectedCallback() { this.resizeObserver?.disconnect(); this.charts?.forEach((chart) => chart.dispose()); }
    async render() {
      await ensureECharts();
      const root = this.shadowRoot || this.attachShadow({ mode: 'open' });
      const isDashboard = payload.kind === 'dashboard';
      root.innerHTML = '<style>:host{display:block;width:100%;min-height:' + (isDashboard ? '640px' : '420px') + ';font-family:Inter,system-ui,sans-serif;color:#111827}.wrap{box-sizing:border-box;width:100%;min-height:inherit;border:1px solid #e5e7eb;border-radius:10px;background:#fff;padding:12px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px}.card{height:320px;border:1px solid #e5e7eb;border-radius:8px;padding:8px}.chart{width:100%;height:' + (isDashboard ? '288px' : '420px') + '}.title{font-size:15px;font-weight:700;margin:0 0 10px}.chart-title{text-align:center;font-size:13px;font-weight:700;margin:0 0 6px}</style><section class="wrap"><h2 class="title"></h2><div class="mount"></div></section>';
      root.querySelector('.title').textContent = payload.title || 'Illustry export';
      const mount = root.querySelector('.mount');
      mount.className = isDashboard ? 'grid' : 'mount';
      this.charts = (payload.charts || []).map((item, index) => {
        const host = document.createElement(isDashboard ? 'article' : 'div');
        host.className = isDashboard ? 'card' : '';
        if (isDashboard) {
          const label = document.createElement('h3');
          label.className = 'chart-title';
          label.textContent = item.title || 'Visualization ' + (index + 1);
          host.appendChild(label);
        }
        const element = document.createElement('div');
        element.className = 'chart';
        host.appendChild(element);
        mount.appendChild(host);
        const chart = window.echarts.init(element, null, { renderer: 'svg' });
        chart.setOption(item.option || {}, true);
        return chart;
      });
      this.resizeObserver = new ResizeObserver(() => this.charts?.forEach((chart) => chart.resize()));
      this.resizeObserver.observe(this);
    }
  }
  if (!customElements.get('${elementName}')) customElements.define('${elementName}', IllustryElement);
})();
  </script>
</body>
</html>`;
};

const createExcelExport = async (
  asset: IllustryLocalAsset,
  png: Buffer,
  charts: Required<IllustryChartPayload>[]
): Promise<IllustryExportFile> => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Illustry';
  const sheet = workbook.addWorksheet('Visualization');
  const imageId = workbook.addImage({ buffer: png, extension: 'png' });
  sheet.addImage(imageId, {
    tl: { col: 1, row: 1 },
    ext: { width: charts[0].width, height: charts[0].height }
  });
  const dataSheet = workbook.addWorksheet('Illustry Data', { state: 'hidden' });
  dataSheet.getCell('A1').value = JSON.stringify(asset);
  const buffer = await workbook.xlsx.writeBuffer();
  return {
    buffer: Buffer.from(buffer),
    filename: `${sanitizeFilename(asset.name)}.xlsx`,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  };
};

const createPdfExport = async (asset: IllustryLocalAsset, png: Buffer): Promise<IllustryExportFile> => {
  const document = await PDFDocument.create();
  const page = document.addPage([960, 540]);
  const image = await document.embedPng(png);
  page.drawImage(image, { x: 0, y: 0, width: 960, height: 540 });
  return {
    buffer: Buffer.from(await document.save()),
    filename: `${sanitizeFilename(asset.name)}.pdf`,
    mimeType: 'application/pdf'
  };
};

const createWordExport = async (asset: IllustryLocalAsset, png: Buffer): Promise<IllustryExportFile> => {
  const document = new Document({
    sections: [{
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({
              data: png,
              transformation: { width: 960, height: 540 },
              type: 'png'
            })
          ]
        })
      ]
    }]
  });
  return {
    buffer: await Packer.toBuffer(document),
    filename: `${sanitizeFilename(asset.name)}.docx`,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  };
};

const createPptExport = async (asset: IllustryLocalAsset, png: Buffer): Promise<IllustryExportFile> => {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'Illustry';
  pptx.company = 'Illustry';
  pptx.subject = asset.name;
  pptx.title = asset.name;
  const slide = pptx.addSlide();
  slide.background = { color: 'FFFFFF' };
  slide.addImage({
    data: `data:image/png;base64,${png.toString('base64')}`,
    x: 0,
    y: 0,
    w: 13.333,
    h: 7.5,
    altText: asset.name
  });
  const output = await pptx.write({ outputType: 'nodebuffer', compression: true });
  const buffer = Buffer.isBuffer(output) ? output : Buffer.from(output as Uint8Array);
  return {
    buffer,
    filename: `${sanitizeFilename(asset.name)}.pptx`,
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  };
};

const createJsonExport = (asset: IllustryLocalAsset): IllustryExportFile => ({
  buffer: Buffer.from(JSON.stringify(asset, null, 2)),
  filename: `${sanitizeFilename(asset.name)}.json`,
  mimeType: 'application/json'
});

const zipFiles = async (files: IllustryExportFile[], title: string): Promise<IllustryExportBundle> => {
  const zip = new JSZip();
  files.forEach((file) => {
    zip.file(file.filename, file.buffer, {
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
  return {
    buffer,
    filename: `${sanitizeFilename(title)}.zip`,
    mimeType: ZIP_MIME,
    bundled: true
  };
};

const createLocalExportBundle = async ({ asset, formats }: LocalExportInput): Promise<IllustryExportBundle> => {
  const normalizedFormats = normalizeFormats(formats);
  const charts = normalizeCharts(asset);
  const svg = renderSvg(asset, charts);
  let png: Buffer | undefined;
  const getPng = async () => {
    png ??= await encodeRaster(svg, 'png');
    return png;
  };
  const files = await Promise.all(normalizedFormats.map(async (format): Promise<IllustryExportFile> => {
    if (format === 'json') return createJsonExport(asset);
    if (format === 'svg') {
      return {
        buffer: Buffer.from(svg),
        filename: `${sanitizeFilename(asset.name)}.svg`,
        mimeType: mimeByFormat.svg
      };
    }
    if (format === 'web-component') {
      return {
        buffer: Buffer.from(buildWebComponentHtml(asset, charts)),
        filename: `${sanitizeFilename(asset.name)}.webcomponent.html`,
        mimeType: 'text/html;charset=utf-8'
      };
    }
    if (format === 'excel') return createExcelExport(asset, await getPng(), charts);
    if (format === 'pdf') return createPdfExport(asset, await getPng());
    if (format === 'word') return createWordExport(asset, await getPng());
    if (format === 'ppt') return createPptExport(asset, await getPng());
    return {
      buffer: await encodeRaster(svg, format),
      filename: `${sanitizeFilename(asset.name)}.${format}`,
      mimeType: mimeByFormat[format]
    };
  }));
  if (files.length === 1) {
    return { ...files[0], bundled: false };
  }
  return zipFiles(files, asset.name);
};

export {
  buildWebComponentHtml,
  createLocalExportBundle,
  isIllustryExportFormat,
  normalizeFormats,
  parseExportFormats,
  renderSvg
};
export type {
  LocalExportInput
};
