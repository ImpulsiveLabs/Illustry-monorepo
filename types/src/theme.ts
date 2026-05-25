type ThemeMode = 'light' | 'dark';

type ThemePalette = {
  colors: string[];
};

type VisualizationTheme = {
  light: ThemePalette;
  dark: ThemePalette;
};

type VisualizationThemeId =
  | 'calendar'
  | 'heb'
  | 'flg'
  | 'sankey'
  | 'wordcloud'
  | 'lineChart'
  | 'barChart'
  | 'scatter'
  | 'pieChart'
  | 'treeMap'
  | 'sunburst'
  | 'funnel';

type VisualizationThemeConfig = Record<VisualizationThemeId, VisualizationTheme>;

type ThemeGlobalTokens = {
  background: string;
  foreground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  input: string;
  ring: string;
  error: string;
  errorForeground: string;
  success: string;
  successForeground: string;
  warning: string;
  warningForeground: string;
  info: string;
  infoForeground: string;
};

type ThemeLayoutTokens = {
  pageBackground: string;
  surface: string;
  sectionBackground: string;
  radius: string;
  shadow: string;
};

type ThemeNavigationTokens = {
  sidebar: {
    background: string;
    foreground: string;
    mutedForeground: string;
    activeBackground: string;
    activeForeground: string;
    hoverBackground: string;
    hoverForeground: string;
    border: string;
    icon: string;
    activeIcon: string;
    menuBackground: string;
    menuForeground: string;
    menuBorder: string;
    menuHoverBackground: string;
  };
  header: {
    background: string;
    foreground: string;
    mutedForeground: string;
    activeBackground: string;
    activeForeground: string;
    hoverBackground: string;
    hoverForeground: string;
    border: string;
    icon: string;
    activeIcon: string;
    menuBackground: string;
    menuForeground: string;
    menuBorder: string;
    menuHoverBackground: string;
  };
};

type ThemeComponentTokens = {
  button: {
    radius: string;
    primaryBackground: string;
    primaryForeground: string;
    secondaryBackground: string;
    secondaryForeground: string;
  };
  input: {
    background: string;
    foreground: string;
    border: string;
    radius: string;
  };
  card: {
    background: string;
    foreground: string;
    border: string;
    radius: string;
    shadow: string;
  };
  modal: {
    background: string;
    foreground: string;
    border: string;
    radius: string;
    shadow: string;
  };
  popover: {
    background: string;
    foreground: string;
    border: string;
    radius: string;
  };
  badge: {
    background: string;
    foreground: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  table: {
    background: string;
    headerBackground: string;
    headerForeground: string;
    rowBackground: string;
    alternatingRowBackground: string;
    rowHoverBackground: string;
    selectedRowBackground: string;
    border: string;
    cellForeground: string;
    mutedCellForeground: string;
    paginationBackground: string;
    paginationForeground: string;
    emptyStateForeground: string;
  };
  tabs: {
    listBackground: string;
    activeBackground: string;
    activeForeground: string;
    inactiveForeground: string;
  };
};

type ThemePageTokens = {
  background: string;
  foreground: string;
  surface: string;
  accent: string;
  muted: string;
  border: string;
  components: {
    button: {
      primaryBackground: string;
      primaryForeground: string;
      secondaryBackground: string;
      secondaryForeground: string;
    };
    input: {
      background: string;
      foreground: string;
      border: string;
    };
    card: {
      background: string;
      foreground: string;
      border: string;
    };
    table: ThemeComponentTokens['table'];
  };
  sections: {
    hero: ThemePageSectionTokens;
    toolbar: ThemePageSectionTokens;
    table: ThemePageSectionTokens;
    form: ThemePageSectionTokens;
    preview: ThemePageSectionTokens;
    content: ThemePageSectionTokens;
  };
  palettes: {
    light: ThemePalette;
    dark: ThemePalette;
  };
};

type ThemePageSectionTokens = {
  background: string;
  foreground: string;
  surface: string;
  accent: string;
  border: string;
};

type ThemePageId =
  | 'home'
  | 'projects'
  | 'projectDetail'
  | 'projectCreate'
  | 'visualizations'
  | 'visualizationCreate'
  | 'visualizationHub'
  | 'dashboards'
  | 'dashboardDetail'
  | 'dashboardCreate'
  | 'account'
  | 'accountEdit'
  | 'themes'
  | 'playground'
  | 'auth'
  | 'share'
  | 'notFound';

type ThemePageConfig = Record<ThemePageId, ThemePageTokens>;

type ThemeVisualConfig = {
  global: ThemeGlobalTokens;
  layout: ThemeLayoutTokens;
  navigation: ThemeNavigationTokens;
  components: ThemeComponentTokens;
  pages: ThemePageConfig;
};

type AppThemeConfig = ThemeVisualConfig & {
  version: 1;
  presetId: string;
  updatedAt: string;
  visualizations: VisualizationThemeConfig;
  modes: {
    dark: Partial<ThemeVisualConfig>;
  };
  extensions?: Record<string, unknown>;
};

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Array<infer U>
    ? Array<U>
    : T[K] extends Record<string, unknown>
      ? DeepPartial<T[K]>
      : T[K];
};

type AppThemeInput = DeepPartial<AppThemeConfig> | Record<string, unknown> | null | undefined;

const VISUALIZATION_THEME_IDS: VisualizationThemeId[] = [
  'calendar',
  'heb',
  'flg',
  'sankey',
  'wordcloud',
  'lineChart',
  'barChart',
  'scatter',
  'pieChart',
  'treeMap',
  'sunburst',
  'funnel'
];

const APP_THEME_PAGES: Array<{ id: ThemePageId; label: string; path: string }> = [
  { id: 'home', label: 'Home', path: '/' },
  { id: 'projects', label: 'Projects', path: '/projects' },
  { id: 'projectDetail', label: 'Project Detail', path: '/projects/[projectName]' },
  { id: 'projectCreate', label: 'New Project', path: '/projects/new' },
  { id: 'visualizations', label: 'Visualizations', path: '/visualizations' },
  { id: 'visualizationCreate', label: 'New Visualization', path: '/visualizations/new' },
  { id: 'visualizationHub', label: 'Visualization Hub', path: '/visualizationhub' },
  { id: 'dashboards', label: 'Dashboards', path: '/dashboards' },
  { id: 'dashboardDetail', label: 'Dashboard Detail', path: '/dashboards/[dashboardName]' },
  { id: 'dashboardCreate', label: 'New Dashboard', path: '/dashboards/new' },
  { id: 'account', label: 'Account', path: '/account' },
  { id: 'accountEdit', label: 'Account Edit', path: '/account/edit' },
  { id: 'themes', label: 'Themes', path: '/theme' },
  { id: 'playground', label: 'Playground', path: '/playground' },
  { id: 'auth', label: 'Auth', path: '/login /register /reset-password' },
  { id: 'share', label: 'Share', path: '/share/* /share-invite' },
  { id: 'notFound', label: 'Not Found', path: '/not-found' }
];

const DEFAULT_CHART_COLORS = [
  '#5DBE6E',
  '#4C8BF5',
  '#F0AC40',
  '#D73D6C',
  '#1D7A8A',
  '#B65911',
  '#84BA5B'
];

const createVisualizationThemes = (colors = DEFAULT_CHART_COLORS): VisualizationThemeConfig => VISUALIZATION_THEME_IDS
  .reduce((accumulator, key) => ({
    ...accumulator,
    [key]: {
      light: { colors: [...colors] },
      dark: { colors: [...colors] }
    }
  }), {} as VisualizationThemeConfig);

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const EMPTY_TABLE_TOKENS: ThemeComponentTokens['table'] = {
  background: '',
  headerBackground: '',
  headerForeground: '',
  rowBackground: '',
  alternatingRowBackground: '',
  rowHoverBackground: '',
  selectedRowBackground: '',
  border: '',
  cellForeground: '',
  mutedCellForeground: '',
  paginationBackground: '',
  paginationForeground: '',
  emptyStateForeground: ''
};

const EMPTY_PAGE_COMPONENTS: ThemePageTokens['components'] = {
  button: {
    primaryBackground: '',
    primaryForeground: '',
    secondaryBackground: '',
    secondaryForeground: ''
  },
  input: {
    background: '',
    foreground: '',
    border: ''
  },
  card: {
    background: '',
    foreground: '',
    border: ''
  },
  table: EMPTY_TABLE_TOKENS
};

const EMPTY_PAGE_SECTION: ThemePageSectionTokens = {
  background: '',
  foreground: '',
  surface: '',
  accent: '',
  border: ''
};

const EMPTY_PAGE_TOKENS: ThemePageTokens = {
  background: '',
  foreground: '',
  surface: '',
  accent: '',
  muted: '',
  border: '',
  components: EMPTY_PAGE_COMPONENTS,
  sections: {
    hero: EMPTY_PAGE_SECTION,
    toolbar: EMPTY_PAGE_SECTION,
    table: EMPTY_PAGE_SECTION,
    form: EMPTY_PAGE_SECTION,
    preview: EMPTY_PAGE_SECTION,
    content: EMPTY_PAGE_SECTION
  },
  palettes: {
    light: { colors: [] },
    dark: { colors: [] }
  }
};

const DEFAULT_LIGHT_VISUAL: ThemeVisualConfig = {
  global: {
    background: '#ffffff',
    foreground: '#09090b',
    primary: '#18181b',
    primaryForeground: '#fafafa',
    secondary: '#f4f4f5',
    secondaryForeground: '#18181b',
    accent: '#f4f4f5',
    accentForeground: '#18181b',
    muted: '#f4f4f5',
    mutedForeground: '#71717a',
    border: '#e4e4e7',
    input: '#e4e4e7',
    ring: '#a1a1aa',
    error: '#ef4444',
    errorForeground: '#fafafa',
    success: '#16a34a',
    successForeground: '#f0fdf4',
    warning: '#f59e0b',
    warningForeground: '#111827',
    info: '#0ea5e9',
    infoForeground: '#f0f9ff'
  },
  layout: {
    pageBackground: '#ffffff',
    surface: '#ffffff',
    sectionBackground: '#f9fafb',
    radius: '0.5rem',
    shadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
  },
  navigation: {
    sidebar: {
      background: '#ffffff',
      foreground: '#18181b',
      mutedForeground: '#71717a',
      activeBackground: '#f4f4f5',
      activeForeground: '#18181b',
      hoverBackground: '#f4f4f5',
      hoverForeground: '#18181b',
      border: '#e4e4e7',
      icon: '#71717a',
      activeIcon: '#18181b',
      menuBackground: '#ffffff',
      menuForeground: '#18181b',
      menuBorder: '#e4e4e7',
      menuHoverBackground: '#f4f4f5'
    },
    header: {
      background: '#ffffff',
      foreground: '#18181b',
      mutedForeground: '#71717a',
      activeBackground: '#f4f4f5',
      activeForeground: '#18181b',
      hoverBackground: '#f4f4f5',
      hoverForeground: '#18181b',
      border: '#e4e4e7',
      icon: '#71717a',
      activeIcon: '#18181b',
      menuBackground: '#ffffff',
      menuForeground: '#18181b',
      menuBorder: '#e4e4e7',
      menuHoverBackground: '#f4f4f5'
    }
  },
  components: {
    button: {
      radius: '0.375rem',
      primaryBackground: '#18181b',
      primaryForeground: '#fafafa',
      secondaryBackground: '#f4f4f5',
      secondaryForeground: '#18181b'
    },
    input: {
      background: '#ffffff',
      foreground: '#09090b',
      border: '#e4e4e7',
      radius: '0.375rem'
    },
    card: {
      background: '#ffffff',
      foreground: '#09090b',
      border: '#e4e4e7',
      radius: '0.5rem',
      shadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
    },
    modal: {
      background: '#ffffff',
      foreground: '#09090b',
      border: '#e4e4e7',
      radius: '0.5rem',
      shadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
    },
    popover: {
      background: '#ffffff',
      foreground: '#09090b',
      border: '#e4e4e7',
      radius: '0.5rem'
    },
    badge: {
      background: '#18181b',
      foreground: '#fafafa',
      success: '#16a34a',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#0ea5e9'
    },
    table: {
      background: '#ffffff',
      headerBackground: '#f4f4f5',
      headerForeground: '#18181b',
      rowBackground: '#ffffff',
      alternatingRowBackground: '#fafafa',
      rowHoverBackground: '#f4f4f5',
      selectedRowBackground: '#e4e4e7',
      border: '#e4e4e7',
      cellForeground: '#18181b',
      mutedCellForeground: '#71717a',
      paginationBackground: '#ffffff',
      paginationForeground: '#18181b',
      emptyStateForeground: '#71717a'
    },
    tabs: {
      listBackground: '#f4f4f5',
      activeBackground: '#ffffff',
      activeForeground: '#09090b',
      inactiveForeground: '#71717a'
    }
  },
  pages: APP_THEME_PAGES.reduce((accumulator, page) => ({
    ...accumulator,
    [page.id]: clone(EMPTY_PAGE_TOKENS)
  }), {} as ThemePageConfig)
};

const DEFAULT_DARK_VISUAL: ThemeVisualConfig = {
  ...DEFAULT_LIGHT_VISUAL,
  global: {
    ...DEFAULT_LIGHT_VISUAL.global,
    background: '#09090b',
    foreground: '#fafafa',
    primary: '#fafafa',
    primaryForeground: '#18181b',
    secondary: '#27272a',
    secondaryForeground: '#fafafa',
    accent: '#27272a',
    accentForeground: '#fafafa',
    muted: '#27272a',
    mutedForeground: '#a1a1aa',
    border: '#27272a',
    input: '#27272a',
    ring: '#27272a',
    error: '#7f1d1d',
    errorForeground: '#fee2e2',
    success: '#166534',
    successForeground: '#dcfce7',
    warning: '#92400e',
    warningForeground: '#fef3c7',
    info: '#075985',
    infoForeground: '#e0f2fe'
  },
  layout: {
    pageBackground: '#09090b',
    surface: '#09090b',
    sectionBackground: '#1f2937',
    radius: '0.5rem',
    shadow: '0 1px 2px 0 rgb(0 0 0 / 0.35)'
  },
  navigation: {
    sidebar: {
      background: '#09090b',
      foreground: '#fafafa',
      mutedForeground: '#a1a1aa',
      activeBackground: '#27272a',
      activeForeground: '#fafafa',
      hoverBackground: '#27272a',
      hoverForeground: '#fafafa',
      border: '#27272a',
      icon: '#a1a1aa',
      activeIcon: '#fafafa',
      menuBackground: '#09090b',
      menuForeground: '#fafafa',
      menuBorder: '#27272a',
      menuHoverBackground: '#27272a'
    },
    header: {
      background: '#09090b',
      foreground: '#fafafa',
      mutedForeground: '#a1a1aa',
      activeBackground: '#27272a',
      activeForeground: '#fafafa',
      hoverBackground: '#27272a',
      hoverForeground: '#fafafa',
      border: '#27272a',
      icon: '#a1a1aa',
      activeIcon: '#fafafa',
      menuBackground: '#09090b',
      menuForeground: '#fafafa',
      menuBorder: '#27272a',
      menuHoverBackground: '#27272a'
    }
  },
  components: {
    ...DEFAULT_LIGHT_VISUAL.components,
    button: {
      radius: '0.375rem',
      primaryBackground: '#fafafa',
      primaryForeground: '#18181b',
      secondaryBackground: '#27272a',
      secondaryForeground: '#fafafa'
    },
    input: {
      background: '#09090b',
      foreground: '#fafafa',
      border: '#27272a',
      radius: '0.375rem'
    },
    card: {
      background: '#09090b',
      foreground: '#fafafa',
      border: '#27272a',
      radius: '0.5rem',
      shadow: '0 1px 2px 0 rgb(0 0 0 / 0.35)'
    },
    modal: {
      background: '#09090b',
      foreground: '#fafafa',
      border: '#27272a',
      radius: '0.5rem',
      shadow: '0 20px 25px -5px rgb(0 0 0 / 0.45)'
    },
    popover: {
      background: '#09090b',
      foreground: '#fafafa',
      border: '#27272a',
      radius: '0.5rem'
    },
    table: {
      background: '#09090b',
      headerBackground: '#27272a',
      headerForeground: '#fafafa',
      rowBackground: '#09090b',
      alternatingRowBackground: '#18181b',
      rowHoverBackground: '#27272a',
      selectedRowBackground: '#3f3f46',
      border: '#27272a',
      cellForeground: '#fafafa',
      mutedCellForeground: '#a1a1aa',
      paginationBackground: '#09090b',
      paginationForeground: '#fafafa',
      emptyStateForeground: '#a1a1aa'
    },
    tabs: {
      listBackground: '#27272a',
      activeBackground: '#09090b',
      activeForeground: '#fafafa',
      inactiveForeground: '#a1a1aa'
    }
  },
  pages: DEFAULT_LIGHT_VISUAL.pages
};

const DEFAULT_APP_THEME_CONFIG: AppThemeConfig = {
  version: 1,
  presetId: 'default',
  updatedAt: '1970-01-01T00:00:00.000Z',
  ...DEFAULT_LIGHT_VISUAL,
  visualizations: createVisualizationThemes(),
  modes: {
    dark: DEFAULT_DARK_VISUAL
  }
};

const THEME_CONFIG_DOCUMENTATION = {
  version: 'Schema version. Current value is 1; future versions can migrate safely.',
  presetId: 'The generic theme/palette used as a starting point. Use custom when the user edits values manually.',
  updatedAt: 'ISO timestamp used to decide whether browser storage or server storage is newer.',
  global: 'Core application colors such as background, foreground, accent, status colors and borders. Values accept hex colors such as #18181b or HSL triples such as 240 10% 3.9%.',
  layout: 'Page background, surfaces, section background, border radius and shared shadow tokens.',
  navigation: 'Header/sidebar/top navigation colors, including text, muted text, active item, hover item, icons, borders and dropdown/menu colors.',
  components: 'Reusable component tokens. Button, input, card, modal, popover, badge, table and tabs values are used globally unless page overrides are present.',
  pages: 'Per-page overrides. Empty strings mean “use fallback”. Fallback order is page section/component override, page override, component override, global/layout default.',
  pageComponents: 'Page-specific component overrides, for example pages.projects.components.table.headerBackground.',
  pageSections: 'Known section overrides for hero, toolbar, table, form, preview and content areas.',
  visualizations: 'Existing visualization palettes. Each visualization has light.colors and dark.colors arrays.',
  modes: 'Mode-specific overrides. modes.dark falls back to the light config when a value is missing.',
  importExport: 'Exported JSON is standard JSON. Optional _documentation is ignored safely on import.'
} as const;

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value)
  && typeof value === 'object'
  && Array.isArray(value) === false;

const sanitizeString = (value: unknown, fallback: string) => {
  if (typeof value !== 'string') {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= 240 ? trimmed : fallback;
};

const sanitizeStringArray = (value: unknown, fallback: string[]) => {
  if (!Array.isArray(value)) {
    return [...fallback];
  }

  const colors = value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0 && entry.length <= 80)
    .slice(0, 20);

  return colors.length > 0 ? colors : [...fallback];
};

const mergeKnownShape = <T extends Record<string, unknown>>(defaults: T, input: unknown): T => {
  const result = clone(defaults);

  if (!isRecord(input)) {
    return result;
  }

  Object.entries(defaults).forEach(([key, defaultValue]) => {
    const candidate = input[key];

    if (Array.isArray(defaultValue)) {
      result[key as keyof T] = sanitizeStringArray(candidate, defaultValue as string[]) as T[keyof T];
      return;
    }

    if (isRecord(defaultValue)) {
      result[key as keyof T] = mergeKnownShape(defaultValue, candidate) as T[keyof T];
      return;
    }

    if (typeof defaultValue === 'string') {
      result[key as keyof T] = sanitizeString(candidate, defaultValue) as T[keyof T];
    }
  });

  return result;
};

const extractLegacyVisualizationTheme = (input: unknown): unknown => {
  if (!isRecord(input)) {
    return undefined;
  }

  if (isRecord(input.visualizations)) {
    return input.visualizations;
  }

  const legacyTheme: Record<string, unknown> = {};
  VISUALIZATION_THEME_IDS.forEach((key) => {
    if (isRecord(input[key])) {
      legacyTheme[key] = input[key];
    }
  });

  return Object.keys(legacyTheme).length > 0 ? legacyTheme : undefined;
};

const normalizeAppThemeConfig = (input?: AppThemeInput): AppThemeConfig => {
  const normalized = mergeKnownShape(DEFAULT_APP_THEME_CONFIG as unknown as Record<string, unknown>, input) as AppThemeConfig;
  const legacyVisualizationTheme = extractLegacyVisualizationTheme(input);

  normalized.version = 1;
  normalized.presetId = sanitizeString(isRecord(input) ? input.presetId : undefined, DEFAULT_APP_THEME_CONFIG.presetId);
  normalized.updatedAt = sanitizeString(isRecord(input) ? input.updatedAt : undefined, DEFAULT_APP_THEME_CONFIG.updatedAt);
  normalized.visualizations = mergeKnownShape(
    DEFAULT_APP_THEME_CONFIG.visualizations as unknown as Record<string, unknown>,
    legacyVisualizationTheme
  ) as VisualizationThemeConfig;
  normalized.modes = {
    dark: mergeKnownShape(DEFAULT_DARK_VISUAL as unknown as Record<string, unknown>, isRecord(input) && isRecord(input.modes)
      ? input.modes.dark
      : undefined) as ThemeVisualConfig
  };

  if (isRecord(input) && isRecord(input.extensions)) {
    normalized.extensions = clone(input.extensions);
  }

  return normalized;
};

const resolveThemeVisualConfig = (config: AppThemeConfig, mode: ThemeMode): ThemeVisualConfig => {
  if (mode === 'light') {
    return {
      global: config.global,
      layout: config.layout,
      navigation: config.navigation,
      components: config.components,
      pages: config.pages
    };
  }

  return mergeKnownShape(
    {
      global: config.global,
      layout: config.layout,
      navigation: config.navigation,
      components: config.components,
      pages: config.pages
    } as unknown as Record<string, unknown>,
    config.modes.dark
  ) as ThemeVisualConfig;
};

const withFallback = (value: string | undefined, fallback: string) => (value && value.trim().length > 0 ? value : fallback);

const resolveThemePageConfig = (
  visual: ThemeVisualConfig,
  pageId: ThemePageId,
  sectionId?: keyof ThemePageTokens['sections']
) => {
  const page = visual.pages[pageId] || EMPTY_PAGE_TOKENS;
  const section = sectionId ? page.sections[sectionId] : undefined;

  return {
    background: withFallback(section?.background, withFallback(page.background, visual.layout.pageBackground)),
    foreground: withFallback(section?.foreground, withFallback(page.foreground, visual.global.foreground)),
    surface: withFallback(section?.surface, withFallback(page.surface, visual.layout.surface)),
    accent: withFallback(section?.accent, withFallback(page.accent, visual.global.accent)),
    muted: withFallback(page.muted, visual.global.muted),
    border: withFallback(section?.border, withFallback(page.border, visual.global.border))
  };
};

const resolveThemeTableConfig = (
  visual: ThemeVisualConfig,
  pageId?: ThemePageId
): ThemeComponentTokens['table'] => {
  const page = pageId ? visual.pages[pageId] : undefined;
  const pageTable = page?.components.table;
  const fallback = visual.components.table;

  return {
    background: withFallback(pageTable?.background, withFallback(page?.surface, fallback.background)),
    headerBackground: withFallback(pageTable?.headerBackground, withFallback(page?.accent, fallback.headerBackground)),
    headerForeground: withFallback(pageTable?.headerForeground, withFallback(page?.foreground, fallback.headerForeground)),
    rowBackground: withFallback(pageTable?.rowBackground, withFallback(page?.surface, fallback.rowBackground)),
    alternatingRowBackground: withFallback(pageTable?.alternatingRowBackground, fallback.alternatingRowBackground),
    rowHoverBackground: withFallback(pageTable?.rowHoverBackground, withFallback(page?.muted, fallback.rowHoverBackground)),
    selectedRowBackground: withFallback(pageTable?.selectedRowBackground, fallback.selectedRowBackground),
    border: withFallback(pageTable?.border, withFallback(page?.border, fallback.border)),
    cellForeground: withFallback(pageTable?.cellForeground, withFallback(page?.foreground, fallback.cellForeground)),
    mutedCellForeground: withFallback(pageTable?.mutedCellForeground, fallback.mutedCellForeground),
    paginationBackground: withFallback(pageTable?.paginationBackground, withFallback(page?.surface, fallback.paginationBackground)),
    paginationForeground: withFallback(pageTable?.paginationForeground, withFallback(page?.foreground, fallback.paginationForeground)),
    emptyStateForeground: withFallback(pageTable?.emptyStateForeground, fallback.emptyStateForeground)
  };
};

export {
  APP_THEME_PAGES,
  DEFAULT_APP_THEME_CONFIG,
  DEFAULT_CHART_COLORS,
  THEME_CONFIG_DOCUMENTATION,
  VISUALIZATION_THEME_IDS,
  createVisualizationThemes,
  normalizeAppThemeConfig,
  resolveThemePageConfig,
  resolveThemeTableConfig,
  resolveThemeVisualConfig
};

export type {
  AppThemeConfig,
  AppThemeInput,
  ThemeComponentTokens,
  ThemeGlobalTokens,
  ThemeLayoutTokens,
  ThemeMode,
  ThemeNavigationTokens,
  ThemePageConfig,
  ThemePageId,
  ThemePageSectionTokens,
  ThemePageTokens,
  ThemePalette,
  ThemeVisualConfig,
  VisualizationTheme,
  VisualizationThemeConfig,
  VisualizationThemeId
};
