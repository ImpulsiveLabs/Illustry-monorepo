import type { VisualizationTypes } from '@illustry/types';

type IllustryAssetKind = 'visualization' | 'dashboard';

type IllustrySourceFormat = 'json' | 'xml' | 'csv' | 'xlsx';

type IllustryChartPayload = {
  title?: string;
  option: Record<string, unknown>;
  width?: number;
  height?: number;
};

type IllustryLocalAsset = {
  id: string;
  kind: IllustryAssetKind;
  name: string;
  type?: string | VisualizationTypes.VisualizationTypesEnum;
  createdAt: string;
  updatedAt: string;
  source?: {
    filename?: string;
    format?: IllustrySourceFormat;
    size?: number;
    rows?: unknown[][];
    data?: unknown;
  };
  charts: IllustryChartPayload[];
  metadata?: Record<string, unknown>;
};

type IllustryExportFormat = 'json' | 'png' | 'jpg' | 'webp' | 'svg' | 'web-component' | 'excel' | 'pdf' | 'word' | 'ppt';

type IllustryExportFile = {
  buffer: Buffer;
  filename: string;
  mimeType: string;
};

type IllustryExportBundle = IllustryExportFile & {
  bundled: boolean;
};

type IllustryLogger = {
  debug?: (message: string, context?: Record<string, unknown>) => void;
  info?: (message: string, context?: Record<string, unknown>) => void;
  warn?: (message: string, context?: Record<string, unknown>) => void;
  error?: (message: string, context?: Record<string, unknown>) => void;
};

type IllustryProfile = {
  name?: string;
  baseUrl?: string;
  token?: string;
  workspaceDir?: string;
};

export type {
  IllustryAssetKind,
  IllustryChartPayload,
  IllustryExportBundle,
  IllustryExportFile,
  IllustryExportFormat,
  IllustryLocalAsset,
  IllustryLogger,
  IllustryProfile,
  IllustrySourceFormat
};
