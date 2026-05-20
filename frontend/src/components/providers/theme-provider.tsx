'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes/dist/types';
import {
  Dispatch,
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef
} from 'react';
import { ThemeTypes, UtilTypes } from '@illustry/types';
import { getUserThemeConfig } from '@/app/_actions/theme';
import { getRealtimeClientId, type RealtimePayload } from '@/lib/realtime-client';
import { cloneDeep } from '@/lib/utils';

type ThemeColors = ThemeTypes.VisualizationThemeConfig;

type VisualizationThemeAction = {
  type: 'apply';
  modifiedData?: UtilTypes.DeepPartial<ThemeColors>;
}

type AppThemeAction = {
  type: 'set';
  themeConfig: ThemeTypes.AppThemeInput;
  touch?: boolean;
}

type AuxProps = {
  children: ReactNode;
  storageScope?: string;
  initialTheme?: ThemeColors | null;
  initialAppTheme?: ThemeTypes.AppThemeConfig | null;
  persist?: boolean;
  applyAppTheme?: boolean;
}

type StoredThemeColors = {
  expiresAt: number;
  theme: ThemeColors;
};

type StoredAppTheme = {
  expiresAt: number;
  updatedAt: string;
  dirty?: boolean;
  themeConfig: ThemeTypes.AppThemeConfig;
};

const THEME_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 14;
const THEME_STYLE_ELEMENT_ID = 'illustry-user-theme-vars';
const THEME_DB_NAME = 'illustry-theme-cache';
const THEME_DB_VERSION = 1;
const THEME_DB_STORE = 'themes';
const getThemeStorageKey = (scope = 'default') => `colorTheme:${scope}`;
const getAppThemeStorageKey = (scope = 'default') => `appTheme:${scope}`;

const initialThemeColors: ThemeColors = ThemeTypes.createVisualizationThemes();

const readJsonFromStorage = <T, >(storageKey: string): T | null => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  const storedTheme = localStorage.getItem(storageKey);
  if (!storedTheme) {
    return null;
  }

  try {
    return JSON.parse(storedTheme) as T;
  } catch {
    localStorage.removeItem(storageKey);
    return null;
  }
};

const readCachedThemeColors = (scope = 'default'): ThemeColors | null => {
  const parsed = readJsonFromStorage<StoredThemeColors | ThemeColors>(getThemeStorageKey(scope));
  if (!parsed) {
    return null;
  }

  if ('expiresAt' in parsed) {
    if (parsed.expiresAt > Date.now()) {
      return ThemeTypes.normalizeAppThemeConfig({
        visualizations: parsed.theme
      }).visualizations;
    }
    localStorage.removeItem(getThemeStorageKey(scope));
    return null;
  }

  return ThemeTypes.normalizeAppThemeConfig({
    visualizations: parsed
  }).visualizations;
};

const readCachedAppThemeConfig = (scope = 'default'): ThemeTypes.AppThemeConfig | null => {
  const parsed = readJsonFromStorage<StoredAppTheme | ThemeTypes.AppThemeConfig>(getAppThemeStorageKey(scope));
  if (!parsed) {
    return null;
  }

  if ('expiresAt' in parsed) {
    if (parsed.expiresAt > Date.now()) {
      return ThemeTypes.normalizeAppThemeConfig(parsed.themeConfig);
    }
    localStorage.removeItem(getAppThemeStorageKey(scope));
    return null;
  }

  return ThemeTypes.normalizeAppThemeConfig(parsed);
};

const getThemeUpdatedAtMs = (themeConfig: ThemeTypes.AppThemeConfig | null | undefined) => {
  if (!themeConfig?.updatedAt) {
    return 0;
  }

  const timestamp = Date.parse(themeConfig.updatedAt);
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const getNewestThemeConfig = (
  localTheme: ThemeTypes.AppThemeConfig | null,
  serverTheme: ThemeTypes.AppThemeConfig | null | undefined
) => {
  if (!localTheme) {
    return serverTheme ? ThemeTypes.normalizeAppThemeConfig(serverTheme) : null;
  }

  if (!serverTheme) {
    return localTheme;
  }

  return getThemeUpdatedAtMs(localTheme) >= getThemeUpdatedAtMs(serverTheme)
    ? localTheme
    : ThemeTypes.normalizeAppThemeConfig(serverTheme);
};

const openThemeDb = () => new Promise<IDBDatabase | null>((resolve) => {
  if (typeof window === 'undefined' || !window.indexedDB) {
    resolve(null);
    return;
  }

  const request = window.indexedDB.open(THEME_DB_NAME, THEME_DB_VERSION);
  request.onupgradeneeded = () => {
    const database = request.result;
    if (!database.objectStoreNames.contains(THEME_DB_STORE)) {
      database.createObjectStore(THEME_DB_STORE);
    }
  };
  request.onerror = () => resolve(null);
  request.onsuccess = () => resolve(request.result);
});

const readAppThemeFromIndexedDb = async (scope = 'default') => {
  const database = await openThemeDb();
  if (!database) {
    return null;
  }

  return new Promise<ThemeTypes.AppThemeConfig | null>((resolve) => {
    const transaction = database.transaction(THEME_DB_STORE, 'readonly');
    const store = transaction.objectStore(THEME_DB_STORE);
    const request = store.get(getAppThemeStorageKey(scope));

    request.onerror = () => resolve(null);
    request.onsuccess = () => {
      const parsed = request.result as StoredAppTheme | undefined;
      if (!parsed || parsed.expiresAt <= Date.now()) {
        resolve(null);
        return;
      }
      resolve(ThemeTypes.normalizeAppThemeConfig(parsed.themeConfig));
    };
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => database.close();
  });
};

const writeAppThemeToIndexedDb = async (scope: string, storedTheme: StoredAppTheme) => {
  const database = await openThemeDb();
  if (!database) {
    return;
  }

  await new Promise<void>((resolve) => {
    const transaction = database.transaction(THEME_DB_STORE, 'readwrite');
    const store = transaction.objectStore(THEME_DB_STORE);
    store.put(storedTheme, getAppThemeStorageKey(scope));
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      resolve();
    };
  });
};

const writeCachedAppThemeConfig = (scope: string, themeConfig: ThemeTypes.AppThemeConfig, dirty = true) => {
  if (typeof window === 'undefined') {
    return;
  }

  const normalizedTheme = ThemeTypes.normalizeAppThemeConfig(themeConfig);
  const storedTheme: StoredAppTheme = {
    expiresAt: Date.now() + THEME_CACHE_TTL_MS,
    updatedAt: normalizedTheme.updatedAt,
    dirty,
    themeConfig: normalizedTheme
  };

  try {
    window.localStorage?.setItem(getAppThemeStorageKey(scope), JSON.stringify(storedTheme));
  } catch {
    // IndexedDB remains the primary store for larger theme configs.
  }

  void writeAppThemeToIndexedDb(scope, storedTheme);
};

const readCachedAppThemeConfigAsync = async (scope = 'default') => (
  await readAppThemeFromIndexedDb(scope)
) || readCachedAppThemeConfig(scope);

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const hexToRgb = (value: string): [number, number, number] | null => {
  const normalized = value.trim();
  const shortMatch = normalized.match(/^#([0-9a-f]{3})$/i);
  if (shortMatch?.[1]) {
    const [r, g, b] = shortMatch[1].split('').map((part) => parseInt(`${part}${part}`, 16));
    return [r || 0, g || 0, b || 0];
  }

  const fullMatch = normalized.match(/^#([0-9a-f]{6})$/i);
  if (!fullMatch?.[1]) {
    return null;
  }

  const hex = fullMatch[1];
  return [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16)
  ];
};

const rgbToHsl = ([r, g, b]: [number, number, number]) => {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  let hue = 0;
  let saturation = 0;
  const lightness = (max + min) / 2;

  if (max !== min) {
    const delta = max - min;
    saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    switch (max) {
      case red:
        hue = (green - blue) / delta + (green < blue ? 6 : 0);
        break;
      case green:
        hue = (blue - red) / delta + 2;
        break;
      default:
        hue = (red - green) / delta + 4;
        break;
    }
    hue /= 6;
  }

  return `${Math.round(hue * 360)} ${Math.round(saturation * 1000) / 10}% ${Math.round(lightness * 1000) / 10}%`;
};

const sanitizeHslTriple = (value: string): string | null => {
  const normalized = value
    .trim()
    .replace(/^hsl\(/i, '')
    .replace(/\)$/i, '')
    .replaceAll(',', ' ')
    .replace(/\s+/g, ' ');
  const match = normalized.match(/^(-?\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/);
  if (!match) {
    return null;
  }

  const hue = Number(match[1]);
  const saturation = clamp(Number(match[2]), 0, 100);
  const lightness = clamp(Number(match[3]), 0, 100);
  return `${Math.round(hue)} ${Math.round(saturation * 10) / 10}% ${Math.round(lightness * 10) / 10}%`;
};

const toHslValue = (value: string, fallback: string) => {
  const hsl = sanitizeHslTriple(value);
  if (hsl) {
    return hsl;
  }

  const rgb = hexToRgb(value);
  if (rgb) {
    return rgbToHsl(rgb);
  }

  return sanitizeHslTriple(fallback) || fallback;
};

const cssVariable = (name: string, value: string) => `  ${name}: ${value};`;
const withCssFallback = (value: string | undefined, fallback: string) => (
  value && value.trim().length > 0 ? value : fallback
);
const isDefaultTokenValue = (value: string | undefined, defaultValue: string | undefined) => (
  Boolean(value)
  && Boolean(defaultValue)
  && value?.trim().toLowerCase() === defaultValue?.trim().toLowerCase()
);
const withDefaultAwareFallback = (
  value: string | undefined,
  defaultValue: string | undefined,
  fallback: string
) => (
  value && !isDefaultTokenValue(value, defaultValue) ? value : fallback
);

const buildVisualVariables = (
  visual: ThemeTypes.ThemeVisualConfig,
  defaultVisual: ThemeTypes.ThemeVisualConfig
) => {
  const { global, layout, navigation, components } = visual;
  const defaultComponents = defaultVisual.components;
  const hsl = (value: string, fallback: string) => toHslValue(value, fallback);
  const popoverBackground = withDefaultAwareFallback(components.popover.background, defaultComponents.popover.background, layout.surface);
  const popoverForeground = withDefaultAwareFallback(components.popover.foreground, defaultComponents.popover.foreground, global.foreground);
  const cardBackground = withDefaultAwareFallback(components.card.background, defaultComponents.card.background, layout.surface);
  const cardForeground = withDefaultAwareFallback(components.card.foreground, defaultComponents.card.foreground, global.foreground);
  const cardBorder = withDefaultAwareFallback(components.card.border, defaultComponents.card.border, global.border);
  const inputBackground = withDefaultAwareFallback(components.input.background, defaultComponents.input.background, global.background);
  const inputForeground = withDefaultAwareFallback(components.input.foreground, defaultComponents.input.foreground, global.foreground);
  const inputBorder = withDefaultAwareFallback(components.input.border, defaultComponents.input.border, global.input);
  const buttonPrimaryBackground = withDefaultAwareFallback(
    components.button.primaryBackground,
    defaultComponents.button.primaryBackground,
    global.primary
  );
  const buttonPrimaryForeground = withDefaultAwareFallback(
    components.button.primaryForeground,
    defaultComponents.button.primaryForeground,
    global.primaryForeground
  );
  const buttonSecondaryBackground = withDefaultAwareFallback(
    components.button.secondaryBackground,
    defaultComponents.button.secondaryBackground,
    global.secondary
  );
  const buttonSecondaryForeground = withDefaultAwareFallback(
    components.button.secondaryForeground,
    defaultComponents.button.secondaryForeground,
    global.secondaryForeground
  );

  return [
    cssVariable('--background', hsl(global.background, '0 0% 100%')),
    cssVariable('--foreground', hsl(global.foreground, '240 10% 3.9%')),
    cssVariable('--muted', hsl(global.muted, '240 4.8% 95.9%')),
    cssVariable('--muted-foreground', hsl(global.mutedForeground, '240 3.8% 46.1%')),
    cssVariable('--popover', hsl(popoverBackground, '0 0% 100%')),
    cssVariable('--popover-foreground', hsl(popoverForeground, '240 10% 3.9%')),
    cssVariable('--card', hsl(cardBackground, '0 0% 100%')),
    cssVariable('--card-foreground', hsl(cardForeground, '240 10% 3.9%')),
    cssVariable('--border', hsl(global.border, '240 5.9% 90%')),
    cssVariable('--input', hsl(inputBorder, '240 5.9% 90%')),
    cssVariable('--primary', hsl(buttonPrimaryBackground, '240 5.9% 10%')),
    cssVariable('--primary-foreground', hsl(buttonPrimaryForeground, '0 0% 98%')),
    cssVariable('--secondary', hsl(buttonSecondaryBackground, '240 4.8% 95.9%')),
    cssVariable('--secondary-foreground', hsl(buttonSecondaryForeground, '240 5.9% 10%')),
    cssVariable('--accent', hsl(global.accent, '240 4.8% 95.9%')),
    cssVariable('--accent-foreground', hsl(global.accentForeground, '240 5.9% 10%')),
    cssVariable('--destructive', hsl(global.error, '0 84.2% 60.2%')),
    cssVariable('--destructive-foreground', hsl(global.errorForeground, '0 0% 98%')),
    cssVariable('--ring', hsl(global.ring, '240 5% 64.9%')),
    cssVariable('--radius', layout.radius),
    cssVariable('--illustry-button-radius', components.button.radius || layout.radius),
    cssVariable('--illustry-input-background', hsl(inputBackground, '0 0% 100%')),
    cssVariable('--illustry-input-foreground', hsl(inputForeground, '240 10% 3.9%')),
    cssVariable('--illustry-input-border', hsl(inputBorder || global.border, '240 5.9% 90%')),
    cssVariable('--illustry-card-background', hsl(cardBackground, '0 0% 100%')),
    cssVariable('--illustry-card-foreground', hsl(cardForeground, '240 10% 3.9%')),
    cssVariable('--illustry-card-border', hsl(cardBorder, '240 5.9% 90%')),
    cssVariable('--illustry-card-radius', components.card.radius || layout.radius),
    cssVariable('--illustry-card-shadow', components.card.shadow || layout.shadow),
    cssVariable('--illustry-page-background', hsl(layout.pageBackground, '0 0% 100%')),
    cssVariable('--illustry-surface', hsl(layout.surface, '0 0% 100%')),
    cssVariable('--illustry-section-background', hsl(layout.sectionBackground, '240 4.8% 95.9%')),
    cssVariable('--illustry-shadow', layout.shadow),
    cssVariable('--illustry-sidebar-background', hsl(navigation.sidebar.background, '0 0% 100%')),
    cssVariable('--illustry-sidebar-foreground', hsl(navigation.sidebar.foreground, '240 10% 3.9%')),
    cssVariable('--illustry-sidebar-muted-foreground', hsl(navigation.sidebar.mutedForeground, '240 3.8% 46.1%')),
    cssVariable('--illustry-sidebar-active-background', hsl(navigation.sidebar.activeBackground, '240 4.8% 95.9%')),
    cssVariable('--illustry-sidebar-active-foreground', hsl(navigation.sidebar.activeForeground, '240 5.9% 10%')),
    cssVariable('--illustry-sidebar-hover-background', hsl(navigation.sidebar.hoverBackground, '240 4.8% 95.9%')),
    cssVariable('--illustry-sidebar-hover-foreground', hsl(navigation.sidebar.hoverForeground, '240 5.9% 10%')),
    cssVariable('--illustry-sidebar-border', hsl(navigation.sidebar.border, '240 5.9% 90%')),
    cssVariable('--illustry-sidebar-icon', hsl(navigation.sidebar.icon, '240 3.8% 46.1%')),
    cssVariable('--illustry-sidebar-active-icon', hsl(navigation.sidebar.activeIcon, '240 5.9% 10%')),
    cssVariable('--illustry-sidebar-menu-background', hsl(navigation.sidebar.menuBackground, '0 0% 100%')),
    cssVariable('--illustry-sidebar-menu-foreground', hsl(navigation.sidebar.menuForeground, '240 10% 3.9%')),
    cssVariable('--illustry-sidebar-menu-border', hsl(navigation.sidebar.menuBorder, '240 5.9% 90%')),
    cssVariable('--illustry-sidebar-menu-hover-background', hsl(navigation.sidebar.menuHoverBackground, '240 4.8% 95.9%')),
    cssVariable('--illustry-header-background', hsl(navigation.header.background, '0 0% 100%')),
    cssVariable('--illustry-header-foreground', hsl(navigation.header.foreground, '240 10% 3.9%')),
    cssVariable('--illustry-header-muted-foreground', hsl(navigation.header.mutedForeground, '240 3.8% 46.1%')),
    cssVariable('--illustry-header-active-background', hsl(navigation.header.activeBackground, '240 4.8% 95.9%')),
    cssVariable('--illustry-header-active-foreground', hsl(navigation.header.activeForeground, '240 5.9% 10%')),
    cssVariable('--illustry-header-hover-background', hsl(navigation.header.hoverBackground, '240 4.8% 95.9%')),
    cssVariable('--illustry-header-hover-foreground', hsl(navigation.header.hoverForeground, '240 5.9% 10%')),
    cssVariable('--illustry-header-border', hsl(navigation.header.border, '240 5.9% 90%')),
    cssVariable('--illustry-header-icon', hsl(navigation.header.icon, '240 3.8% 46.1%')),
    cssVariable('--illustry-header-active-icon', hsl(navigation.header.activeIcon, '240 5.9% 10%')),
    cssVariable('--illustry-header-menu-background', hsl(navigation.header.menuBackground, '0 0% 100%')),
    cssVariable('--illustry-header-menu-foreground', hsl(navigation.header.menuForeground, '240 10% 3.9%')),
    cssVariable('--illustry-header-menu-border', hsl(navigation.header.menuBorder, '240 5.9% 90%')),
    cssVariable('--illustry-header-menu-hover-background', hsl(navigation.header.menuHoverBackground, '240 4.8% 95.9%')),
    cssVariable('--illustry-success', hsl(global.success, '142 71% 45%')),
    cssVariable('--illustry-success-foreground', hsl(global.successForeground, '138 76% 97%')),
    cssVariable('--illustry-warning', hsl(global.warning, '38 92% 50%')),
    cssVariable('--illustry-warning-foreground', hsl(global.warningForeground, '221 39% 11%')),
    cssVariable('--illustry-info', hsl(global.info, '199 89% 48%')),
    cssVariable('--illustry-info-foreground', hsl(global.infoForeground, '204 100% 97%')),
    cssVariable('--illustry-table-background', hsl(components.table.background, '0 0% 100%')),
    cssVariable('--illustry-table-header-background', hsl(components.table.headerBackground, '240 4.8% 95.9%')),
    cssVariable('--illustry-table-header-foreground', hsl(components.table.headerForeground, '240 10% 3.9%')),
    cssVariable('--illustry-table-row-background', hsl(components.table.rowBackground, '0 0% 100%')),
    cssVariable('--illustry-table-alternating-row-background', hsl(components.table.alternatingRowBackground, '0 0% 98%')),
    cssVariable('--illustry-table-row-hover-background', hsl(components.table.rowHoverBackground, '240 4.8% 95.9%')),
    cssVariable('--illustry-table-selected-row-background', hsl(components.table.selectedRowBackground, '240 5.9% 90%')),
    cssVariable('--illustry-table-border', hsl(components.table.border, '240 5.9% 90%')),
    cssVariable('--illustry-table-cell-foreground', hsl(components.table.cellForeground, '240 10% 3.9%')),
    cssVariable('--illustry-table-muted-cell-foreground', hsl(components.table.mutedCellForeground, '240 3.8% 46.1%')),
    cssVariable('--illustry-table-pagination-background', hsl(components.table.paginationBackground, '0 0% 100%')),
    cssVariable('--illustry-table-pagination-foreground', hsl(components.table.paginationForeground, '240 10% 3.9%')),
    cssVariable('--illustry-table-empty-state-foreground', hsl(components.table.emptyStateForeground, '240 3.8% 46.1%')),
    cssVariable('--illustry-tabs-list-background', hsl(components.tabs.listBackground, '240 4.8% 95.9%')),
    cssVariable('--illustry-tabs-active-background', hsl(components.tabs.activeBackground, '0 0% 100%'))
  ].join('\n');
};

const buildPageVariables = (
  visual: ThemeTypes.ThemeVisualConfig,
  defaultVisual: ThemeTypes.ThemeVisualConfig,
  selectorPrefix = ''
) => {
  const hsl = (value: string, fallback: string) => toHslValue(value, fallback);
  const defaultComponents = defaultVisual.components;
  const componentButtonPrimaryBackground = withDefaultAwareFallback(
    visual.components.button.primaryBackground,
    defaultComponents.button.primaryBackground,
    visual.global.primary
  );
  const componentButtonPrimaryForeground = withDefaultAwareFallback(
    visual.components.button.primaryForeground,
    defaultComponents.button.primaryForeground,
    visual.global.primaryForeground
  );
  const componentButtonSecondaryBackground = withDefaultAwareFallback(
    visual.components.button.secondaryBackground,
    defaultComponents.button.secondaryBackground,
    visual.global.secondary
  );
  const componentButtonSecondaryForeground = withDefaultAwareFallback(
    visual.components.button.secondaryForeground,
    defaultComponents.button.secondaryForeground,
    visual.global.secondaryForeground
  );
  const componentInputBackground = withDefaultAwareFallback(
    visual.components.input.background,
    defaultComponents.input.background,
    visual.global.background
  );
  const componentInputForeground = withDefaultAwareFallback(
    visual.components.input.foreground,
    defaultComponents.input.foreground,
    visual.global.foreground
  );
  const componentInputBorder = withDefaultAwareFallback(
    visual.components.input.border,
    defaultComponents.input.border,
    visual.global.input || visual.global.border
  );
  const componentCardBackground = withDefaultAwareFallback(
    visual.components.card.background,
    defaultComponents.card.background,
    visual.layout.surface
  );
  const componentCardForeground = withDefaultAwareFallback(
    visual.components.card.foreground,
    defaultComponents.card.foreground,
    visual.global.foreground
  );
  const componentCardBorder = withDefaultAwareFallback(
    visual.components.card.border,
    defaultComponents.card.border,
    visual.global.border
  );

  return ThemeTypes.APP_THEME_PAGES.map((page) => {
    const pageConfig = visual.pages[page.id];
    const pageTokens = ThemeTypes.resolveThemePageConfig(visual, page.id);
    const pageComponents = pageConfig?.components;
    const tableTokens = ThemeTypes.resolveThemeTableConfig(visual, page.id);
    const buttonPrimaryBackground = withCssFallback(
      pageComponents?.button.primaryBackground,
      withCssFallback(pageConfig?.accent, componentButtonPrimaryBackground)
    );
    const buttonPrimaryForeground = withCssFallback(
      pageComponents?.button.primaryForeground,
      withCssFallback(pageConfig?.foreground, componentButtonPrimaryForeground)
    );
    const buttonSecondaryBackground = withCssFallback(
      pageComponents?.button.secondaryBackground,
      withCssFallback(pageConfig?.surface, componentButtonSecondaryBackground)
    );
    const buttonSecondaryForeground = withCssFallback(
      pageComponents?.button.secondaryForeground,
      withCssFallback(pageConfig?.foreground, componentButtonSecondaryForeground)
    );
    const inputBackground = withCssFallback(
      pageComponents?.input.background,
      withCssFallback(pageConfig?.surface, componentInputBackground)
    );
    const inputForeground = withCssFallback(
      pageComponents?.input.foreground,
      withCssFallback(pageConfig?.foreground, componentInputForeground)
    );
    const inputBorder = withCssFallback(
      pageComponents?.input.border,
      withCssFallback(pageConfig?.border, componentInputBorder)
    );
    const cardBackground = withCssFallback(
      pageComponents?.card.background,
      withCssFallback(pageConfig?.surface, componentCardBackground)
    );
    const cardForeground = withCssFallback(
      pageComponents?.card.foreground,
      withCssFallback(pageConfig?.foreground, componentCardForeground)
    );
    const cardBorder = withCssFallback(
      pageComponents?.card.border,
      withCssFallback(pageConfig?.border, componentCardBorder)
    );
    const selector = `${selectorPrefix}[data-illustry-page="${page.id}"]`;

    return `${selector} {\n${[
      cssVariable('--background', hsl(pageTokens.background, '0 0% 100%')),
      cssVariable('--foreground', hsl(pageTokens.foreground, '240 10% 3.9%')),
      cssVariable('--card', hsl(cardBackground, '0 0% 100%')),
      cssVariable('--card-foreground', hsl(cardForeground, '240 10% 3.9%')),
      cssVariable('--muted', hsl(pageTokens.muted, '240 4.8% 95.9%')),
      cssVariable('--border', hsl(pageTokens.border, '240 5.9% 90%')),
      cssVariable('--input', hsl(inputBorder, '240 5.9% 90%')),
      cssVariable('--primary', hsl(buttonPrimaryBackground, '240 5.9% 10%')),
      cssVariable('--primary-foreground', hsl(buttonPrimaryForeground, '0 0% 98%')),
      cssVariable('--secondary', hsl(buttonSecondaryBackground, '240 4.8% 95.9%')),
      cssVariable('--secondary-foreground', hsl(buttonSecondaryForeground, '240 5.9% 10%')),
      cssVariable('--accent', hsl(pageTokens.accent, '240 4.8% 95.9%')),
      cssVariable('--illustry-page-background', hsl(pageTokens.background, '0 0% 100%')),
      cssVariable('--illustry-page-foreground', hsl(pageTokens.foreground, '240 10% 3.9%')),
      cssVariable('--illustry-surface', hsl(pageTokens.surface, '0 0% 100%')),
      cssVariable('--illustry-section-background', hsl(pageTokens.surface, '240 4.8% 95.9%')),
      cssVariable('--illustry-page-accent', hsl(pageTokens.accent, '240 4.8% 95.9%')),
      cssVariable('--illustry-input-background', hsl(inputBackground, '0 0% 100%')),
      cssVariable('--illustry-input-foreground', hsl(inputForeground, '240 10% 3.9%')),
      cssVariable('--illustry-input-border', hsl(inputBorder, '240 5.9% 90%')),
      cssVariable('--illustry-card-background', hsl(cardBackground, '0 0% 100%')),
      cssVariable('--illustry-card-foreground', hsl(cardForeground, '240 10% 3.9%')),
      cssVariable('--illustry-card-border', hsl(cardBorder, '240 5.9% 90%')),
      cssVariable('--illustry-table-background', hsl(tableTokens.background, '0 0% 100%')),
      cssVariable('--illustry-table-header-background', hsl(tableTokens.headerBackground, '240 4.8% 95.9%')),
      cssVariable('--illustry-table-header-foreground', hsl(tableTokens.headerForeground, '240 10% 3.9%')),
      cssVariable('--illustry-table-row-background', hsl(tableTokens.rowBackground, '0 0% 100%')),
      cssVariable('--illustry-table-alternating-row-background', hsl(tableTokens.alternatingRowBackground, '0 0% 98%')),
      cssVariable('--illustry-table-row-hover-background', hsl(tableTokens.rowHoverBackground, '240 4.8% 95.9%')),
      cssVariable('--illustry-table-selected-row-background', hsl(tableTokens.selectedRowBackground, '240 5.9% 90%')),
      cssVariable('--illustry-table-border', hsl(tableTokens.border, '240 5.9% 90%')),
      cssVariable('--illustry-table-cell-foreground', hsl(tableTokens.cellForeground, '240 10% 3.9%')),
      cssVariable('--illustry-table-muted-cell-foreground', hsl(tableTokens.mutedCellForeground, '240 3.8% 46.1%')),
      cssVariable('--illustry-table-pagination-background', hsl(tableTokens.paginationBackground, '0 0% 100%')),
      cssVariable('--illustry-table-pagination-foreground', hsl(tableTokens.paginationForeground, '240 10% 3.9%')),
      cssVariable('--illustry-table-empty-state-foreground', hsl(tableTokens.emptyStateForeground, '240 3.8% 46.1%'))
    ].join('\n')}\n}`;
  }).join('\n');
};

const buildThemeStyleText = (themeConfig: ThemeTypes.AppThemeConfig) => {
  const normalizedTheme = ThemeTypes.normalizeAppThemeConfig(themeConfig);
  const lightVisual = ThemeTypes.resolveThemeVisualConfig(normalizedTheme, 'light');
  const darkVisual = ThemeTypes.resolveThemeVisualConfig(normalizedTheme, 'dark');
  const defaultLightVisual = ThemeTypes.resolveThemeVisualConfig(ThemeTypes.DEFAULT_APP_THEME_CONFIG, 'light');
  const defaultDarkVisual = ThemeTypes.resolveThemeVisualConfig(ThemeTypes.DEFAULT_APP_THEME_CONFIG, 'dark');

  return `:root {\n${buildVisualVariables(lightVisual, defaultLightVisual)}\n}\n${buildPageVariables(lightVisual, defaultLightVisual)}\n.dark {\n${buildVisualVariables(darkVisual, defaultDarkVisual)}\n}\n${buildPageVariables(darkVisual, defaultDarkVisual, '.dark ')}`;
};

const applyThemeStyleText = (themeConfig: ThemeTypes.AppThemeConfig) => {
  if (typeof document === 'undefined') {
    return;
  }

  const normalizedTheme = ThemeTypes.normalizeAppThemeConfig(themeConfig);

  let styleElement = document.getElementById(THEME_STYLE_ELEMENT_ID) as HTMLStyleElement | null;
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = THEME_STYLE_ELEMENT_ID;
    document.head.appendChild(styleElement);
  }

  styleElement.textContent = buildThemeStyleText(normalizedTheme);
  document.documentElement.dataset.illustryThemePreset = normalizedTheme.presetId;
  document.documentElement.dataset.illustryThemeUpdatedAt = normalizedTheme.updatedAt;
};

const ThemeColorsContext = createContext<ThemeColors>(initialThemeColors);
const ThemeDispatchContext = createContext<Dispatch<VisualizationThemeAction> | undefined>(undefined);
const AppThemeContext = createContext<ThemeTypes.AppThemeConfig>(ThemeTypes.normalizeAppThemeConfig());
const AppThemeDispatchContext = createContext<Dispatch<AppThemeAction> | undefined>(undefined);

const themeColorsReducer = (
  data: ThemeColors,
  action: VisualizationThemeAction
): ThemeColors => {
  if (action.type === 'apply' && action.modifiedData) {
    const newData: ThemeColors = cloneDeep(data);
    Object.entries(action.modifiedData).forEach(([key]) => {
      if (key in newData) {
        const nextValue = (action.modifiedData as Record<string, unknown>)[key];
        newData[key as keyof ThemeColors] = {
          ...newData[key as keyof ThemeColors],
          ...(nextValue && typeof nextValue === 'object' ? nextValue : {})
        } as ThemeColors[keyof ThemeColors];
      }
    });

    return ThemeTypes.normalizeAppThemeConfig({
      visualizations: newData
    }).visualizations;
  }

  return cloneDeep(data);
};

const appThemeReducer = (
  data: ThemeTypes.AppThemeConfig,
  action: AppThemeAction
): ThemeTypes.AppThemeConfig => {
  if (action.type === 'set') {
    const normalizedTheme = ThemeTypes.normalizeAppThemeConfig(action.themeConfig);
    if (action.touch !== false) {
      normalizedTheme.updatedAt = new Date().toISOString();
    }
    return normalizedTheme;
  }

  return ThemeTypes.normalizeAppThemeConfig(data);
};

const ThemeColorsProvider = ({
  children,
  storageScope = 'default',
  initialTheme,
  initialAppTheme,
  persist = true,
  applyAppTheme = false
}: AuxProps) => {
  const initialProviderAppTheme = useMemo(() => {
    const cachedTheme = typeof window !== 'undefined' && window.localStorage
      ? readCachedAppThemeConfig(storageScope)
      : null;
    const newestTheme = getNewestThemeConfig(cachedTheme, initialAppTheme);

    if (newestTheme) {
      return newestTheme;
    }

    return ThemeTypes.normalizeAppThemeConfig();
  }, [initialAppTheme, storageScope]);

  const initialProviderTheme = useMemo(() => {
    if (initialTheme) {
      return ThemeTypes.normalizeAppThemeConfig({ visualizations: initialTheme }).visualizations;
    }

    if (initialAppTheme) {
      return initialProviderAppTheme.visualizations;
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      return readCachedThemeColors(storageScope) || initialProviderAppTheme.visualizations;
    }

    return initialProviderAppTheme.visualizations;
  }, [initialAppTheme, initialProviderAppTheme, initialTheme, storageScope]);

  const [themeProv, dispatchDataProv] = useReducer(themeColorsReducer, initialProviderTheme);
  const [appThemeProv, dispatchAppThemeBase] = useReducer(appThemeReducer, initialProviderAppTheme);
  const appThemeDirtyRef = useRef(false);
  const initialThemeSyncKeyRef = useRef<string | null>(null);
  const initialAppThemeSyncKeyRef = useRef<string | null>(null);
  const realtimeClientId = useMemo(() => getRealtimeClientId(), []);
  const dispatchAppTheme = useCallback((action: AppThemeAction) => {
    if (action.type !== 'set') {
      dispatchAppThemeBase(action);
      return;
    }

    const normalizedTheme = ThemeTypes.normalizeAppThemeConfig(action.themeConfig);
    if (action.touch !== false) {
      normalizedTheme.updatedAt = new Date().toISOString();
    }

    if (applyAppTheme) {
      applyThemeStyleText(normalizedTheme);
    }

    appThemeDirtyRef.current = action.touch !== false;
    if (persist && typeof window !== 'undefined') {
      writeCachedAppThemeConfig(storageScope, normalizedTheme, appThemeDirtyRef.current);
    }

    dispatchAppThemeBase({ type: 'set', themeConfig: normalizedTheme, touch: false });
  }, [applyAppTheme, persist, storageScope]);

  useEffect(() => {
    if (!initialTheme) {
      initialThemeSyncKeyRef.current = null;
      return;
    }

    const normalizedTheme = ThemeTypes.normalizeAppThemeConfig({
      visualizations: initialTheme
    }).visualizations;
    const nextSyncKey = JSON.stringify(normalizedTheme);
    if (initialThemeSyncKeyRef.current === nextSyncKey) {
      return;
    }

    initialThemeSyncKeyRef.current = nextSyncKey;
    dispatchDataProv({ type: 'apply', modifiedData: normalizedTheme });
  }, [initialTheme]);

  useEffect(() => {
    if (!initialAppTheme) {
      initialAppThemeSyncKeyRef.current = null;
      return;
    }

    const normalizedTheme = ThemeTypes.normalizeAppThemeConfig(initialAppTheme);
    const nextSyncKey = JSON.stringify(normalizedTheme);
    if (initialAppThemeSyncKeyRef.current === nextSyncKey) {
      return;
    }

    initialAppThemeSyncKeyRef.current = nextSyncKey;
    dispatchAppTheme({ type: 'set', themeConfig: normalizedTheme, touch: false });
    dispatchDataProv({ type: 'apply', modifiedData: normalizedTheme.visualizations });
  }, [dispatchAppTheme, initialAppTheme]);

  useEffect(() => {
    let cancelled = false;

    const loadAsyncCachedTheme = async () => {
      const cachedTheme = await readCachedAppThemeConfigAsync(storageScope);
      if (!cachedTheme || cancelled) {
        return;
      }

      if (getThemeUpdatedAtMs(cachedTheme) > getThemeUpdatedAtMs(appThemeProv)) {
        dispatchAppTheme({ type: 'set', themeConfig: cachedTheme, touch: false });
        dispatchDataProv({ type: 'apply', modifiedData: cachedTheme.visualizations });
      }
    };

    void loadAsyncCachedTheme();

    return () => {
      cancelled = true;
    };
  }, [appThemeProv, dispatchAppTheme, storageScope]);

  useEffect(() => {
    if (!persist || typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    localStorage.setItem(getThemeStorageKey(storageScope), JSON.stringify({
      expiresAt: Date.now() + THEME_CACHE_TTL_MS,
      theme: themeProv
    }));
    localStorage.removeItem('colorTheme');
  }, [persist, storageScope, themeProv]);

  useEffect(() => {
    if (!persist || typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    writeCachedAppThemeConfig(storageScope, appThemeProv, appThemeDirtyRef.current);
  }, [appThemeProv, persist, storageScope]);

  useEffect(() => {
    if (applyAppTheme) {
      applyThemeStyleText(appThemeProv);
    }
  }, [appThemeProv, applyAppTheme]);

  useEffect(() => {
    if (
      !persist
      || !process.env.NEXT_PUBLIC_BACKEND_PUBLIC_URL
      || typeof WebSocket === 'undefined'
    ) {
      return undefined;
    }

    const url = new URL('/api/realtime', process.env.NEXT_PUBLIC_BACKEND_PUBLIC_URL);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.searchParams.set('resource', 'theme');
    url.searchParams.set('shareId', 'me');
    url.searchParams.set('clientId', realtimeClientId);

    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let socket: WebSocket | undefined;
    let closedByComponent = false;

    const applyLatestTheme = async () => {
      const latestTheme = await getUserThemeConfig();
      if (!latestTheme || closedByComponent) {
        return;
      }

      dispatchAppTheme({ type: 'set', themeConfig: latestTheme, touch: false });
      dispatchDataProv({ type: 'apply', modifiedData: latestTheme.visualizations });
    };

    const connect = () => {
      socket = new WebSocket(url.toString());
      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as RealtimePayload;
          if (payload.type === 'connected' || payload.originClientId === realtimeClientId) {
            return;
          }
          if (payload.action === 'theme-updated') {
            void applyLatestTheme();
          }
        } catch {
          // Ignore malformed realtime messages instead of disturbing the current theme.
        }
      };
      socket.onclose = () => {
        if (!closedByComponent) {
          reconnectTimer = setTimeout(connect, 2000);
        }
      };
    };

    connect();

    return () => {
      closedByComponent = true;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      socket?.close();
    };
  }, [dispatchAppTheme, persist, realtimeClientId]);

  return (
    <AppThemeContext.Provider value={appThemeProv}>
      <AppThemeDispatchContext.Provider value={dispatchAppTheme}>
        <ThemeColorsContext.Provider value={themeProv}>
          <ThemeDispatchContext.Provider value={dispatchDataProv}>
            {children}
          </ThemeDispatchContext.Provider>
        </ThemeColorsContext.Provider>
      </AppThemeDispatchContext.Provider>
    </AppThemeContext.Provider>
  );
};

const useThemeColors = () => useContext(ThemeColorsContext);
const useThemeColorsDispach = () => useContext(ThemeDispatchContext);
const useAppThemeConfig = () => useContext(AppThemeContext);
const useAppThemeConfigDispatch = () => useContext(AppThemeDispatchContext);

const ThemeProvider = ({ children, ...props }: ThemeProviderProps) => <NextThemesProvider {...props}>{children}</NextThemesProvider>;

export type { ThemeColors };
export {
  ThemeColorsProvider,
  applyThemeStyleText,
  buildThemeStyleText,
  readCachedAppThemeConfig,
  readCachedAppThemeConfigAsync,
  readCachedThemeColors,
  writeCachedAppThemeConfig,
  useAppThemeConfig,
  useAppThemeConfigDispatch,
  useThemeColors,
  useThemeColorsDispach,
  ThemeProvider
};
