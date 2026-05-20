'use client';

import * as echarts from 'echarts/core';
import type { EChartsType } from 'echarts/core';

const EXPORT_BACKGROUND = '#ffffff';
const ECHARTS_CDN_URL = 'https://cdn.jsdelivr.net/npm/echarts@6/dist/echarts.min.js';
const ECHARTS_WORDCLOUD_CDN_URL = 'https://cdn.jsdelivr.net/npm/echarts-wordcloud@2/dist/echarts-wordcloud.min.js';

export type ChartExportFormat = 'png' | 'jpg' | 'webp' | 'svg' | 'web-component';

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

type WebComponentChart = {
  title: string;
  option: unknown;
};

type WebComponentPayload = {
  kind: 'visualization' | 'dashboard';
  title: string;
  charts: WebComponentChart[];
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

const serializeForWebComponent = (value: unknown) => JSON.stringify(value, (_key, item) => {
  if (typeof item === 'function') {
    return {
      __illustryFunction: item.toString()
    };
  }

  return item;
});

const escapeScriptJson = (value: string) => value
  .replace(/</g, '\\u003c')
  .replace(/>/g, '\\u003e')
  .replace(/&/g, '\\u0026')
  .replace(/\u2028/g, '\\u2028')
  .replace(/\u2029/g, '\\u2029');

const buildWebComponentHtml = (payload: WebComponentPayload) => {
  const elementName = payload.kind === 'dashboard' ? 'illustry-dashboard' : 'illustry-visualization';
  const safeTitle = svgEscape(payload.title);
  const payloadJson = escapeScriptJson(serializeForWebComponent(payload));

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle}</title>
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
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Unable to load ' + src));
    document.head.appendChild(script);
  });
  const reviveFunction = (source) => {
    try {
      const trimmed = String(source || '').trim();
      const normalized = /^[A-Za-z_$][\\w$]*\\s*\\(/.test(trimmed) && !trimmed.startsWith('function')
        ? 'function ' + trimmed
        : trimmed;
      return Function('"use strict"; return (' + normalized + ');')();
    } catch (_error) {
      return undefined;
    }
  };
  const revive = (value) => {
    if (Array.isArray(value)) {
      return value.map(revive);
    }
    if (value && typeof value === 'object') {
      if (typeof value.__illustryFunction === 'string') {
        return reviveFunction(value.__illustryFunction);
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

const downloadWebComponent = (payload: WebComponentPayload, filename: string) => {
  const safeFilename = sanitizeFilename(filename);
  const html = buildWebComponentHtml(payload);
  downloadBlob(new Blob([html], { type: 'text/html;charset=utf-8' }), `${safeFilename}.webcomponent.html`);
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
  format: Exclude<ChartExportFormat, 'svg' | 'web-component'>
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

const getDashboardWebComponentCharts = (element: HTMLElement): WebComponentChart[] => Array.from(
  element.querySelectorAll<HTMLElement>('[_echarts_instance_]')
)
  .reduce<WebComponentChart[]>((charts, chartElement, index) => {
    const chart = echarts.getInstanceByDom(chartElement);
    if (!chart) {
      return charts;
    }
    const cardElement = chartElement.closest<HTMLElement>('[data-dashboard-visualization-title]');
    const title = cardElement?.dataset.dashboardVisualizationTitle || `Visualization ${index + 1}`;
    charts.push({
      title,
      option: chart.getOption()
    });
    return charts;
  }, []);

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
  if (format === 'web-component') {
    downloadWebComponent({
      kind: 'visualization',
      title: safeFilename,
      charts: [{
        title: safeFilename,
        option: chart.getOption()
      }]
    }, safeFilename);
    return;
  }

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
  if (format === 'web-component') {
    const webComponentCharts = getDashboardWebComponentCharts(element);
    if (!webComponentCharts.length) {
      throw new Error('No dashboard visualizations are ready to export yet.');
    }
    const safeFilename = sanitizeFilename(filename);
    downloadWebComponent({
      kind: 'dashboard',
      title: safeFilename,
      charts: webComponentCharts
    }, safeFilename);
    return;
  }

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
