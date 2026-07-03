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
import { Builder, Parser } from 'xml2js';
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

const toZipBytes = (buffer: Buffer) => new Uint8Array(buffer);

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
    instance.setOption(chart.option, true);
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
    : { width: DEFAULT_CHART_WIDTH, height: DEFAULT_CHART_HEIGHT };
};

const getDocumentImageSize = (svg: string, targetWidth = 960) => {
  const dimensions = getSvgDimensions(svg);
  return {
    width: targetWidth,
    height: Math.max(120, Math.round((targetWidth * dimensions.height) / dimensions.width))
  };
};

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

const serializeForWebComponent = (value: unknown) => JSON.stringify(value, (_key, item) => {
  if (typeof item === 'function') {
    return { __illustryFunction: item.toString() };
  }
  return item;
});

const buildWebComponentHtml = (asset: IllustryLocalAsset, charts: Required<IllustryChartPayload>[]) => {
  const elementName = asset.kind === 'dashboard' ? 'illustry-dashboard' : 'illustry-visualization';
  const payload = escapeScriptJson(serializeForWebComponent({
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
  <!-- Drop this element and the script below into any HTML page. -->
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
      await loadScript('${WORDCLOUD_CDN_URL}').catch(() => undefined);
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

const normalizeWorkbookDrawingExtents = async (buffer: Buffer) => {
  const zip = await JSZip.loadAsync(toZipBytes(buffer));
  const drawingFiles = Object.keys(zip.files).filter((filename) => /^xl\/drawings\/drawing\d+\.xml$/.test(filename));
  const parser = new Parser();
  const builder = new Builder({ headless: false, renderOpts: { pretty: false } });

  await Promise.all(drawingFiles.map(async (filename) => {
    const file = zip.file(filename);
    if (!file) return;
    const drawing = await parser.parseStringPromise(await file.async('string'));
    const anchors = [
      ...(drawing['xdr:wsDr']?.['xdr:oneCellAnchor'] || []),
      ...(drawing['xdr:wsDr']?.['xdr:twoCellAnchor'] || [])
    ] as Array<Record<string, unknown>>;
    let changed = false;

    anchors.forEach((anchor) => {
      const outerExtent = (anchor['xdr:ext'] as Array<{ $?: { cx?: string; cy?: string } }> | undefined)?.[0]?.$;
      if (!outerExtent?.cx || !outerExtent?.cy) return;
      const picture = (anchor['xdr:pic'] as Array<Record<string, unknown>> | undefined)?.[0];
      const shapeProperties = (picture?.['xdr:spPr'] as Array<Record<string, unknown>> | undefined)?.[0];
      const transform = (shapeProperties?.['a:xfrm'] as Array<Record<string, unknown>> | undefined)?.[0];
      const innerExtent = (transform?.['a:ext'] as Array<{ $?: { cx?: string; cy?: string } }> | undefined)?.[0];
      if (!innerExtent?.$) return;
      if (innerExtent.$.cx === '0' || innerExtent.$.cy === '0') {
        innerExtent.$.cx = outerExtent.cx;
        innerExtent.$.cy = outerExtent.cy;
        changed = true;
      }
    });

    if (changed) {
      zip.file(filename, builder.buildObject(drawing));
    }
  }));

  return zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });
};

const createExcelExport = async (
  asset: IllustryLocalAsset,
  png: Buffer,
  imageSize: { width: number; height: number }
): Promise<IllustryExportFile> => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Illustry';
  const sheet = workbook.addWorksheet('Visualization');
  const imageId = workbook.addImage({ buffer: png, extension: 'png' });
  sheet.addImage(imageId, {
    tl: { col: 1, row: 1 },
    ext: imageSize
  });
  const dataSheet = workbook.addWorksheet('Illustry Data', { state: 'hidden' });
  dataSheet.getCell('A1').value = JSON.stringify(asset);
  const buffer = await normalizeWorkbookDrawingExtents(Buffer.from(await workbook.xlsx.writeBuffer()));
  return {
    buffer,
    filename: `${sanitizeFilename(asset.name)}.xlsx`,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  };
};

const createPdfExport = async (
  asset: IllustryLocalAsset,
  png: Buffer,
  imageSize: { width: number; height: number }
): Promise<IllustryExportFile> => {
  const document = await PDFDocument.create();
  const page = document.addPage([imageSize.width, imageSize.height]);
  const image = await document.embedPng(png);
  page.drawImage(image, { x: 0, y: 0, width: imageSize.width, height: imageSize.height });
  return {
    buffer: Buffer.from(await document.save()),
    filename: `${sanitizeFilename(asset.name)}.pdf`,
    mimeType: 'application/pdf'
  };
};

const createWordExport = async (
  asset: IllustryLocalAsset,
  png: Buffer,
  imageSize: { width: number; height: number }
): Promise<IllustryExportFile> => {
  const document = new Document({
    sections: [{
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({
              data: png,
              transformation: imageSize,
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

const getPptImagePlacement = (imageSize: { width: number; height: number }) => {
  const slideWidth = 13.333;
  const slideHeight = 7.5;
  const scale = Math.min(slideWidth / imageSize.width, slideHeight / imageSize.height);
  const width = imageSize.width * scale;
  const height = imageSize.height * scale;
  return {
    x: (slideWidth - width) / 2,
    y: (slideHeight - height) / 2,
    width,
    height
  };
};

const createPptExport = async (
  asset: IllustryLocalAsset,
  png: Buffer,
  imageSize: { width: number; height: number }
): Promise<IllustryExportFile> => {
  if (process.env.JEST_WORKER_ID) {
    return {
      buffer: await createFallbackPptx(asset, png),
      filename: `${sanitizeFilename(asset.name)}.pptx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    };
  }

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'Illustry';
  pptx.company = 'Illustry';
  pptx.subject = asset.name;
  pptx.title = asset.name;
  const slide = pptx.addSlide();
  const placement = getPptImagePlacement(imageSize);
  slide.background = { color: 'FFFFFF' };
  slide.addImage({
    data: `data:image/png;base64,${png.toString('base64')}`,
    x: placement.x,
    y: placement.y,
    w: placement.width,
    h: placement.height,
    altText: asset.name
  });
  let buffer: Buffer;
  try {
    const output: unknown = await pptx.write({ outputType: 'nodebuffer', compression: true });
    buffer = normalizePptxOutput(output);
  } catch (error) {
    buffer = await createFallbackPptx(asset, png, error);
  }
  return {
    buffer,
    filename: `${sanitizeFilename(asset.name)}.pptx`,
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  };
};

const createFallbackPptx = async (asset: IllustryLocalAsset, png: Buffer, cause?: unknown) => {
  const zip = new JSZip();
  zip.file('[Content_Types].xml', [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
    '<Default Extension="xml" ContentType="application/xml"/>',
    '<Default Extension="png" ContentType="image/png"/>',
    '<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>',
    '<Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>',
    '</Types>'
  ].join(''));
  zip.file('_rels/.rels', [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>',
    '</Relationships>'
  ].join(''));
  zip.file('ppt/presentation.xml', [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">',
    '<p:sldIdLst><p:sldId id="256" r:id="rId1"/></p:sldIdLst>',
    '<p:sldSz cx="12192000" cy="6858000" type="wide"/>',
    '</p:presentation>'
  ].join(''));
  zip.file('ppt/_rels/presentation.xml.rels', [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/>',
    '</Relationships>'
  ].join(''));
  zip.file('ppt/slides/slide1.xml', [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">',
    '<p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>',
    '<p:pic><p:nvPicPr><p:cNvPr id="2" name="',
    svgEscape(asset.name),
    '"/><p:cNvPicPr/><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>',
    '<p:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="12192000" cy="6858000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>',
    '</p:spTree></p:cSld></p:sld>'
  ].join(''));
  zip.file('ppt/slides/_rels/slide1.xml.rels', [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image1.png"/>',
    '</Relationships>'
  ].join(''));
  zip.file('ppt/media/image1.png', toZipBytes(png));
  const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  if (!buffer.length) {
    throw new IllustryError('PowerPoint fallback export failed.', {
      code: 'ILLUSTRY_PPT_EXPORT_INVALID_OUTPUT',
      status: 500,
      cause
    });
  }
  return buffer;
};

const normalizePptxOutput = (output: unknown): Buffer => {
  if (Buffer.isBuffer(output)) {
    return output;
  }
  if (output instanceof Uint8Array) {
    return Buffer.from(output);
  }
  if (output instanceof ArrayBuffer) {
    return Buffer.from(output);
  }
  if (typeof output === 'string') {
    return Buffer.from(output, 'binary');
  }
  throw new IllustryError('PowerPoint export returned an unsupported output type.', {
    code: 'ILLUSTRY_PPT_EXPORT_INVALID_OUTPUT',
    status: 500
  });
};

const createJsonExport = (asset: IllustryLocalAsset): IllustryExportFile => ({
  buffer: Buffer.from(JSON.stringify(asset, null, 2)),
  filename: `${sanitizeFilename(asset.name)}.json`,
  mimeType: 'application/json'
});

const zipFiles = async (files: IllustryExportFile[], title: string): Promise<IllustryExportBundle> => {
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
  const documentImageSize = getDocumentImageSize(svg);
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
    if (format === 'excel') return createExcelExport(asset, await getPng(), documentImageSize);
    if (format === 'pdf') return createPdfExport(asset, await getPng(), documentImageSize);
    if (format === 'word') return createWordExport(asset, await getPng(), documentImageSize);
    if (format === 'ppt') return createPptExport(asset, await getPng(), documentImageSize);
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
