'use client';

import * as echarts from 'echarts/core';
import type { EChartsType } from 'echarts/core';

const EXPORT_BACKGROUND = '#ffffff';

export type ChartExportFormat = 'png' | 'jpg' | 'webp' | 'svg';

type ExportChartOptions = {
  chart: EChartsType;
  filename: string;
  format: ChartExportFormat;
};

type ExportDashboardOptions = {
  element: HTMLElement;
  filename: string;
  format: ChartExportFormat;
};

const rasterMimeTypes = {
  png: 'image/png',
  jpg: 'image/jpeg',
  webp: 'image/webp'
} as const;

const svgEscape = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/"/g, '&quot;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

const sanitizeFilename = (value: string) => value
  .trim()
  .replace(/[/\\?%*:|"<>]/g, '-')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '')
  || 'visualization';

const imageDataUrlToSvgBlob = ({
  dataUrl,
  width,
  height,
  title
}: {
  dataUrl: string;
  width: number;
  height: number;
  title: string;
}) => {
  if (!width || !height) {
    throw new Error('The visualization is not ready to export yet.');
  }

  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg"',
    ` width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"`,
    ' role="img">',
    `<title>${svgEscape(title)}</title>`,
    `<rect width="100%" height="100%" fill="${EXPORT_BACKGROUND}" />`,
    `<image href="${svgEscape(dataUrl)}" width="${width}" height="${height}" />`,
    '</svg>'
  ].join('');

  return new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
};

const downloadBlob = (blob: Blob, filename: string) => {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
};

const loadImage = async (source: string) => {
  const image = new Image();
  const loaded = new Promise<HTMLImageElement>((resolve, reject) => {
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Unable to load the ECharts export.'));
  });
  image.src = source;
  return loaded;
};

const rasterizeDataUrl = async (dataUrl: string, mimeType: string) => {
  const image = await loadImage(dataUrl);
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;

  if (!width || !height) {
    throw new Error('The visualization is not ready to export yet.');
  }

  const canvas = document.createElement('canvas');
  const scale = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Unable to prepare the export canvas.');
  }

  context.fillStyle = EXPORT_BACKGROUND;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.scale(scale, scale);
  context.drawImage(image, 0, 0, width, height);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Unable to create the requested image.'));
      }
    }, mimeType, 0.95);
  });
};

const downloadEChartsDataUrl = async (
  dataUrl: string,
  filename: string,
  format: Exclude<ChartExportFormat, 'svg'>
) => {
  const safeFilename = sanitizeFilename(filename);
  const blob = await rasterizeDataUrl(dataUrl, rasterMimeTypes[format]);
  downloadBlob(blob, `${safeFilename}.${format}`);
};

const getEChartsPngDataUrl = (chart: EChartsType) => chart.getDataURL({
  type: 'png',
  pixelRatio: 2,
  backgroundColor: EXPORT_BACKGROUND,
  excludeComponents: ['toolbox']
});

const getChartExportSize = (chart: EChartsType) => {
  const dom = chart.getDom();
  const rect = dom.getBoundingClientRect();
  return {
    width: Math.round(rect.width || chart.getWidth()),
    height: Math.round(rect.height || chart.getHeight())
  };
};

const getDashboardCharts = (element: HTMLElement) => Array.from(
  element.querySelectorAll<HTMLElement>('[_echarts_instance_]')
)
  .map((chartElement) => echarts.getInstanceByDom(chartElement))
  .filter((chart): chart is EChartsType => Boolean(chart));

const getDashboardPngDataUrl = (charts: EChartsType[]) => {
  const firstChart = charts[0];
  if (!firstChart) {
    throw new Error('No dashboard visualizations are ready to export yet.');
  }

  const previousGroups = charts.map((chart) => chart.group);
  const groupId = echarts.connect(charts);

  try {
    return firstChart.getConnectedDataURL({
      type: 'png',
      pixelRatio: 2,
      connectedBackgroundColor: EXPORT_BACKGROUND,
      excludeComponents: ['toolbox']
    });
  } finally {
    echarts.disconnect(groupId);
    charts.forEach((chart, index) => {
      const previousGroup = previousGroups[index];
      chart.group = previousGroup ?? '';
    });
  }
};

const getDashboardExportSize = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect();
  return {
    width: Math.round(rect.width),
    height: Math.round(rect.height)
  };
};

export const exportChart = async ({
  chart,
  filename,
  format
}: ExportChartOptions) => {
  const safeFilename = sanitizeFilename(filename);
  const dataUrl = getEChartsPngDataUrl(chart);

  if (format === 'svg') {
    downloadBlob(imageDataUrlToSvgBlob({
      dataUrl,
      ...getChartExportSize(chart),
      title: safeFilename
    }), `${safeFilename}.svg`);
    return;
  }

  await downloadEChartsDataUrl(dataUrl, filename, format);
};

export const exportDashboardCharts = async ({
  element,
  filename,
  format
}: ExportDashboardOptions) => {
  const charts = getDashboardCharts(element);
  if (!charts.length) {
    throw new Error('No dashboard visualizations are ready to export yet.');
  }

  const safeFilename = sanitizeFilename(filename);
  const dataUrl = getDashboardPngDataUrl(charts);

  if (format === 'svg') {
    downloadBlob(imageDataUrlToSvgBlob({
      dataUrl,
      ...getDashboardExportSize(element),
      title: safeFilename
    }), `${safeFilename}.svg`);
    return;
  }

  await downloadEChartsDataUrl(dataUrl, filename, format);
};
