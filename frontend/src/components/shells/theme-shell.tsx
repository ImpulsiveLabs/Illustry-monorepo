'use client';

import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { useTheme } from 'next-themes';
import { ThemeTypes, VisualizationTypes } from '@illustry/types';
import { toast } from 'sonner';
import siteConfig from '@/config/site';
import {
  resetUserThemeConfig,
  saveUserThemeConfig
} from '@/app/_actions/theme';
import { syncVisualizationThemes } from '@/app/_actions/visualization';
import { useLocale } from '@/components/providers/locale-provider';
import Input from '@/components/ui/input';
import Textarea from '@/components/ui/textarea';
import Label from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import Checkbox from '@/components/ui/checkbox';
import Fallback from '@/components/ui/fallback';
import Icons from '@/components/icons';
import { cn } from '@/lib/utils';
import {
  useAppThemeConfig,
  useAppThemeConfigDispatch,
  useThemeColors,
  useThemeColorsDispach
} from '../providers/theme-provider';
import DefaultThemesAccordion from '../ui/theme/default-themes';
import GenericThemesAccordion from '../ui/theme/generic-themes';
import SankeyGraphShellView from './sankey/sankey-shell';
import WordCloudShellView from './wordcloud/wordcloud-shell';
import TreeMapShellView from './treemap/treemap-shell';
import SunBurstShellView from './sunburst/sunburst-shell';
import ScatterShellView from './scatter/scatter-shell';
import PieChartShellView from './pie-chart/piechart-shell';
import ForcedLayoutGraphShellView from './forced-layout-graph/forced-layout-graph-shell';
import CalendarGraphShellView from './calendar/calendar-shell';
import FunnelShellView from './funnel/funnel-shell';
import AxisChartsShellView from './axis/axis-shell';
import HierarchicalEdgeBundlingShellView from './hierarchical-edge-bundling/hierarchical-edge-bundling-shell';

type ShowDiagramState = {
  heb: boolean;
  sankey: boolean;
  calendar: boolean;
  flg: boolean;
  wordCloud: boolean;
  lineChart: boolean;
  barChart: boolean;
  pieChart: boolean;
  scatter: boolean;
  treeMap: boolean;
  sunburst: boolean;
  funnel: boolean;
  timeline?: boolean;
  matrix?: boolean;
}

type ThemeSectionId =
  | 'presets'
  | 'global'
  | 'layout'
  | 'navigation'
  | 'components'
  | 'pages'
  | 'advanced'
  | 'importExport'
  | 'visualizations';

type VisualizationSectionConfig = {
  id: ThemeTypes.VisualizationThemeId;
  showDiagramKey: keyof ShowDiagramState;
  translationKey: string;
};

type ThemeShellProps = {
  embedded?: boolean;
};

const MAIN_SECTIONS: Array<{ id: ThemeSectionId; translationKey: string }> = [
  { id: 'presets', translationKey: 'theme.section.presets' },
  { id: 'global', translationKey: 'theme.section.global' },
  { id: 'layout', translationKey: 'theme.section.layout' },
  { id: 'navigation', translationKey: 'theme.section.navigation' },
  { id: 'components', translationKey: 'theme.section.components' },
  { id: 'pages', translationKey: 'theme.section.pages' },
  { id: 'advanced', translationKey: 'theme.section.advanced' },
  { id: 'importExport', translationKey: 'theme.section.importExport' }
];

const VISUALIZATION_SECTIONS: VisualizationSectionConfig[] = [
  { id: 'sankey', showDiagramKey: 'sankey', translationKey: 'theme.sankeyDiagram' },
  { id: 'calendar', showDiagramKey: 'calendar', translationKey: 'theme.calendar' },
  { id: 'flg', showDiagramKey: 'flg', translationKey: 'theme.forcedLayoutGraph' },
  { id: 'heb', showDiagramKey: 'heb', translationKey: 'theme.hierarchicalEdgeBundling' },
  { id: 'wordcloud', showDiagramKey: 'wordCloud', translationKey: 'theme.wordCloud' },
  { id: 'lineChart', showDiagramKey: 'lineChart', translationKey: 'theme.lineChart' },
  { id: 'barChart', showDiagramKey: 'barChart', translationKey: 'theme.barChart' },
  { id: 'pieChart', showDiagramKey: 'pieChart', translationKey: 'theme.pieChart' },
  { id: 'scatter', showDiagramKey: 'scatter', translationKey: 'theme.scatter' },
  { id: 'treeMap', showDiagramKey: 'treeMap', translationKey: 'theme.treeMap' },
  { id: 'sunburst', showDiagramKey: 'sunburst', translationKey: 'theme.sunburst' },
  { id: 'funnel', showDiagramKey: 'funnel', translationKey: 'theme.funnel' }
];

const EMPTY_SHOW_DIAGRAM: ShowDiagramState = {
  sankey: false,
  heb: false,
  flg: false,
  wordCloud: false,
  calendar: false,
  lineChart: false,
  barChart: false,
  scatter: false,
  pieChart: false,
  treeMap: false,
  sunburst: false,
  funnel: false,
  matrix: false,
  timeline: false
};

const normalizeSearchValue = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

const cloneTheme = (theme: ThemeTypes.AppThemeConfig) => JSON.parse(JSON.stringify(theme)) as ThemeTypes.AppThemeConfig;

const isHexColor = (value: string | undefined) => Boolean(value?.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i));

const getColorInputValue = (value: string | undefined, fallback: string) => {
  if (isHexColor(value)) {
    return value as string;
  }
  return isHexColor(fallback) ? fallback : '#000000';
};

const makePresetTheme = (
  currentTheme: ThemeTypes.AppThemeConfig,
  presetId: string,
  colors: string[]
): ThemeTypes.AppThemeConfig => {
  const nextTheme = cloneTheme(currentTheme);
  const [primary, secondary, accent, error, info, warning, success] = colors;
  nextTheme.presetId = presetId;
  nextTheme.visualizations = ThemeTypes.createVisualizationThemes(colors);
  nextTheme.global.primary = primary || nextTheme.global.primary;
  nextTheme.global.secondary = secondary || nextTheme.global.secondary;
  nextTheme.global.accent = accent || nextTheme.global.accent;
  nextTheme.global.error = error || nextTheme.global.error;
  nextTheme.global.info = info || nextTheme.global.info;
  nextTheme.global.warning = warning || nextTheme.global.warning;
  nextTheme.global.success = success || nextTheme.global.success;
  nextTheme.components.button.primaryBackground = nextTheme.global.primary;
  nextTheme.components.button.secondaryBackground = nextTheme.global.secondary;
  nextTheme.components.badge.background = nextTheme.global.primary;
  nextTheme.components.badge.error = nextTheme.global.error;
  nextTheme.components.badge.info = nextTheme.global.info;
  nextTheme.components.badge.warning = nextTheme.global.warning;
  nextTheme.components.badge.success = nextTheme.global.success;
  return ThemeTypes.normalizeAppThemeConfig(nextTheme);
};

const getPageTokens = (
  visual: ThemeTypes.ThemeVisualConfig,
  pageId: ThemeTypes.ThemePageId
) => ThemeTypes.resolveThemePageConfig(visual, pageId);

const getPageLabelKey = (pageId: ThemeTypes.ThemePageId) => `theme.page.${pageId}`;

const getTokenLabelKey = (token: string) => `theme.token.${token}`;

const ColorField = ({
  id,
  label,
  value,
  fallback,
  optional = false,
  clearLabel,
  swatchLabel,
  onChange,
  onClear
}: {
  id: string;
  label: string;
  value?: string;
  fallback: string;
  optional?: boolean;
  clearLabel?: string;
  swatchLabel?: string;
  onChange: (value: string) => void;
  onClear?: () => void;
}) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between gap-2">
      <Label htmlFor={id}>{label}</Label>
      {optional && (
        <button
          type="button"
          className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          onClick={onClear}
        >
          {clearLabel}
        </button>
      )}
    </div>
    <div className="flex items-center gap-2">
      <input
        aria-label={swatchLabel ? `${label} ${swatchLabel}` : label}
        type="color"
        value={getColorInputValue(value, fallback)}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-10 shrink-0 rounded-md border border-input bg-background p-1"
      />
      <Input
        id={id}
        value={value ?? ''}
        placeholder={fallback}
        onChange={(event) => onChange(event.target.value)}
        className="h-9"
      />
    </div>
  </div>
);

const TextTokenField = ({
  id,
  label,
  value,
  onChange
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) => (
  <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    <Input
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-9"
    />
  </div>
);

const SectionHeader = ({
  title,
  description
}: {
  title: string;
  description: string;
}) => (
  <div className="space-y-1">
    <h1 className="text-2xl font-semibold tracking-normal">{title}</h1>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);

const ThemeModeTabs = ({
  mode,
  onChange,
  lightLabel,
  darkLabel
}: {
  mode: ThemeTypes.ThemeMode;
  onChange: (mode: ThemeTypes.ThemeMode) => void;
  lightLabel: string;
  darkLabel: string;
}) => (
  <Tabs value={mode} onValueChange={(value) => onChange(value as ThemeTypes.ThemeMode)} className="w-full">
    <TabsList className="grid w-full grid-cols-2">
      <TabsTrigger value="light">{lightLabel}</TabsTrigger>
      <TabsTrigger value="dark">{darkLabel}</TabsTrigger>
    </TabsList>
  </Tabs>
);

const PaletteSelector = ({
  palettes,
  label,
  description,
  applyLabel,
  onApply
}: {
  palettes: Record<string, string[]>;
  label: string;
  description: string;
  applyLabel: string;
  onApply: (paletteName: string, colors: string[]) => void;
}) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm">{label}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent className="grid gap-2 sm:grid-cols-2">
      {Object.entries(palettes).map(([paletteName, colors]) => (
        <button
          key={paletteName}
          type="button"
          aria-label={`${applyLabel}: ${paletteName}`}
          className="rounded-md border border-border bg-background p-3 text-left transition hover:border-primary"
          onClick={() => onApply(paletteName, colors)}
        >
          <span className="block text-sm font-medium">{paletteName}</span>
          <span className="mt-2 flex h-3 overflow-hidden rounded-full">
            {colors.slice(0, 8).map((color, index) => (
              <span
                key={`${paletteName}-${color}-${index}`}
                className="flex-1"
                style={{ backgroundColor: color }}
              />
            ))}
          </span>
        </button>
      ))}
    </CardContent>
  </Card>
);

const ThemePreview = ({
  config,
  mode,
  selectedPage,
  selectedVisualization,
  t
}: {
  config: ThemeTypes.AppThemeConfig;
  mode: ThemeTypes.ThemeMode;
  selectedPage: ThemeTypes.ThemePageId;
  selectedVisualization: ThemeTypes.VisualizationThemeId;
  t: (key: string) => string;
}) => {
  const visual = ThemeTypes.resolveThemeVisualConfig(config, mode);
  const pageTokens = getPageTokens(visual, selectedPage);
  const tableTokens = ThemeTypes.resolveThemeTableConfig(visual, selectedPage);
  const pageMeta = ThemeTypes.APP_THEME_PAGES.find((page) => page.id === selectedPage);
  const visualizationColors = config.visualizations[selectedVisualization]?.[mode]?.colors || [];

  return (
    <div
      className="h-full overflow-y-auto rounded-lg border p-4"
      style={{
        backgroundColor: pageTokens.background,
        color: visual.global.foreground,
        borderColor: visual.global.border
      }}
    >
      <div
        className="mb-4 flex items-center justify-between border-b pb-3"
        style={{
          borderColor: visual.navigation.header.border,
          backgroundColor: visual.navigation.header.background,
          color: visual.navigation.header.foreground
        }}
      >
        <div className="text-sm font-semibold">Illustry</div>
        <div className="flex gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: visual.global.success }} />
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: visual.global.warning }} />
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: visual.global.info }} />
        </div>
      </div>

      <div className="grid gap-3">
        <section
          className="rounded-md border p-4"
          style={{
            backgroundColor: pageTokens.surface,
            borderColor: visual.components.card.border,
            boxShadow: visual.components.card.shadow,
            borderRadius: visual.components.card.radius
          }}
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase text-muted-foreground">{t('theme.preview.page')}</p>
              <h2 className="text-lg font-semibold">{t(getPageLabelKey(selectedPage))}</h2>
              <p className="text-sm" style={{ color: visual.global.mutedForeground }}>{pageMeta?.path}</p>
            </div>
            <Badge
              style={{
                backgroundColor: pageTokens.accent,
                color: visual.global.accentForeground,
                borderColor: 'transparent'
              }}
            >
              {t('theme.preview.live')}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <button
              type="button"
              className="rounded-md px-3 py-2 font-medium"
              style={{
                backgroundColor: visual.components.button.primaryBackground,
                color: visual.components.button.primaryForeground,
                borderRadius: visual.components.button.radius
              }}
            >
              {t('theme.preview.primary')}
            </button>
            <button
              type="button"
              className="rounded-md border px-3 py-2 font-medium"
              style={{
                backgroundColor: visual.components.button.secondaryBackground,
                color: visual.components.button.secondaryForeground,
                borderColor: visual.global.border,
                borderRadius: visual.components.button.radius
              }}
            >
              {t('theme.preview.secondary')}
            </button>
          </div>
        </section>

        <section
          className="grid gap-3 rounded-md border p-4"
          style={{
            backgroundColor: visual.layout.sectionBackground,
            borderColor: visual.global.border,
            borderRadius: visual.layout.radius
          }}
        >
          <div className="grid grid-cols-[92px_1fr] gap-3">
            <div
              className="rounded-md border p-2 text-xs"
              style={{
                backgroundColor: visual.navigation.sidebar.background,
                color: visual.navigation.sidebar.foreground,
                borderColor: visual.navigation.sidebar.border
              }}
            >
              <div
                className="mb-2 rounded px-2 py-1"
                style={{
                  backgroundColor: visual.navigation.sidebar.activeBackground,
                  color: visual.navigation.sidebar.activeForeground
                }}
              >
                {t('nav.projects')}
              </div>
              <div className="px-2 py-1">{t('theme.section.presets')}</div>
              <div className="px-2 py-1">{t('theme.preview.data')}</div>
            </div>
            <div className="space-y-2">
              <Input placeholder={t('theme.preview.searchDatasets')} readOnly value="" />
              <div
                className="rounded-md border"
                style={{
                  backgroundColor: tableTokens.background,
                  borderColor: tableTokens.border
                }}
              >
                <div
                  className="grid grid-cols-3 gap-2 border-b px-3 py-2 text-xs font-medium"
                  style={{
                    backgroundColor: tableTokens.headerBackground,
                    borderColor: tableTokens.border,
                    color: tableTokens.headerForeground
                  }}
                >
                  <span>{t('common.name')}</span>
                  <span>{t('theme.preview.status')}</span>
                  <span>{t('theme.preview.owner')}</span>
                </div>
                {['Atlas', 'Pulse'].map((name, index) => (
                  <div
                    key={name}
                    className="grid grid-cols-3 gap-2 border-b px-3 py-2 text-xs last:border-b-0"
                    style={{
                      backgroundColor: index % 2 === 1 ? tableTokens.alternatingRowBackground : tableTokens.rowBackground,
                      borderColor: tableTokens.border,
                      color: tableTokens.cellForeground
                    }}
                  >
                    <span>{name}</span>
                    <span>{t('theme.preview.ready')}</span>
                    <span>{t('theme.preview.you')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-3 rounded-md border p-4" style={{ borderColor: visual.global.border }}>
          <div className="flex flex-wrap gap-2">
            <Badge style={{ backgroundColor: visual.components.badge.success, color: visual.global.successForeground }}>{t('theme.preview.success')}</Badge>
            <Badge style={{ backgroundColor: visual.components.badge.warning, color: visual.global.warningForeground }}>{t('theme.preview.warning')}</Badge>
            <Badge style={{ backgroundColor: visual.components.badge.error, color: visual.global.errorForeground }}>{t('theme.preview.error')}</Badge>
            <Badge style={{ backgroundColor: visual.components.badge.info, color: visual.global.infoForeground }}>{t('theme.preview.info')}</Badge>
          </div>
          <div
            className="rounded-md border p-3 text-sm"
            style={{
              backgroundColor: visual.components.modal.background,
              color: visual.components.modal.foreground,
              borderColor: visual.components.modal.border,
              boxShadow: visual.components.modal.shadow
            }}
          >
            <div className="font-medium">{t('theme.preview.modalPopover')}</div>
            <p style={{ color: visual.global.mutedForeground }}>{t('theme.preview.tokensAppliedLive')}</p>
          </div>
          <div className="flex gap-1">
            {visualizationColors.slice(0, 10).map((color, index) => (
              <span
                key={`${color}-${index}`}
                className="h-5 flex-1 rounded-sm border"
                style={{ backgroundColor: color, borderColor: visual.global.border }}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

const VisualizationPreview = ({
  selectedVisualization
}: {
  selectedVisualization: ThemeTypes.VisualizationThemeId;
}) => {
  const wrapperClassName = "min-h-[360px] rounded-lg border bg-background p-3";

  switch (selectedVisualization) {
    case 'sankey':
      return (
        <div className={wrapperClassName}>
          <SankeyGraphShellView fullScreen data={siteConfig.nodeLink} legend options={false} filter={false} />
        </div>
      );
    case 'calendar':
      return (
        <div className={wrapperClassName}>
          <Suspense fallback={<Fallback />}>
            <CalendarGraphShellView data={{ calendar: siteConfig.calendar }} legend options={false} filter={false} fullScreen />
          </Suspense>
        </div>
      );
    case 'flg':
      return (
        <div className={wrapperClassName}>
          <Suspense fallback={<Fallback />}>
            <ForcedLayoutGraphShellView data={siteConfig.nodeLink} legend options={false} filter={false} fullScreen />
          </Suspense>
        </div>
      );
    case 'wordcloud':
      return (
        <div className={wrapperClassName}>
          <Suspense fallback={<Fallback />}>
            <WordCloudShellView data={{ words: siteConfig.words }} legend options={false} filter={false} fullScreen />
          </Suspense>
        </div>
      );
    case 'heb':
      return (
        <div className={wrapperClassName}>
          <Suspense fallback={<Fallback />}>
            <HierarchicalEdgeBundlingShellView data={siteConfig.nodeLink} legend options={false} filter={false} fullScreen />
          </Suspense>
        </div>
      );
    case 'lineChart':
      return (
        <div className={wrapperClassName}>
          <Suspense fallback={<Fallback />}>
            <AxisChartsShellView data={siteConfig.axisChart} legend options={false} type="line" filter={false} fullScreen />
          </Suspense>
        </div>
      );
    case 'barChart':
      return (
        <div className={wrapperClassName}>
          <Suspense fallback={<Fallback />}>
            <AxisChartsShellView data={siteConfig.axisChart} legend options={false} type="bar" filter={false} fullScreen />
          </Suspense>
        </div>
      );
    case 'pieChart':
      return (
        <div className={wrapperClassName}>
          <Suspense fallback={<Fallback />}>
            <PieChartShellView data={siteConfig.pieChart} legend options={false} filter={false} fullScreen />
          </Suspense>
        </div>
      );
    case 'funnel':
      return (
        <div className={wrapperClassName}>
          <Suspense fallback={<Fallback />}>
            <FunnelShellView data={siteConfig.funnel} legend options={false} filter={false} fullScreen />
          </Suspense>
        </div>
      );
    case 'scatter':
      return (
        <div className={wrapperClassName}>
          <Suspense fallback={<Fallback />}>
            <ScatterShellView data={siteConfig.scatter as VisualizationTypes.ScatterData} legend options={false} filter={false} fullScreen />
          </Suspense>
        </div>
      );
    case 'treeMap':
      return (
        <div className={wrapperClassName}>
          <Suspense fallback={<Fallback />}>
            <TreeMapShellView data={siteConfig.hierarchy as VisualizationTypes.HierarchyData} legend options={false} filter={false} fullScreen />
          </Suspense>
        </div>
      );
    case 'sunburst':
      return (
        <div className={wrapperClassName}>
          <Suspense fallback={<Fallback />}>
            <SunBurstShellView data={siteConfig.hierarchy as VisualizationTypes.HierarchyData} legend options={false} filter={false} fullScreen />
          </Suspense>
        </div>
      );
    default:
      return null;
  }
};

const ThemeShell = ({ embedded = false }: ThemeShellProps) => {
  const { t } = useLocale();
  const { resolvedTheme } = useTheme();
  const colorPalette: { [key: string]: string[] } = siteConfig.colorPallets;
  const activeTheme = useThemeColors();
  const themeDispatch = useThemeColorsDispach();
  const appTheme = useAppThemeConfig();
  const appThemeDispatch = useAppThemeConfigDispatch();
  const themeSyncMountedRef = useRef(false);
  const themeSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appThemeSyncMountedRef = useRef(false);
  const appThemeSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasResolvedInitialModeRef = useRef(false);
  const [selectedSchemeName, setSelectedSchemeName] = useState<string | null>(appTheme.presetId || null);
  const [activeSection, setActiveSection] = useState<ThemeSectionId>('presets');
  const [mode, setMode] = useState<ThemeTypes.ThemeMode>('light');
  const [sectionSearch, setSectionSearch] = useState('');
  const [selectedVisualization, setSelectedVisualization] = useState<ThemeTypes.VisualizationThemeId>('sankey');
  const [selectedPage, setSelectedPage] = useState<ThemeTypes.ThemePageId>('themes');
  const [jsonDraft, setJsonDraft] = useState(() => JSON.stringify(appTheme, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [importDraft, setImportDraft] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [syncState, setSyncState] = useState<'idle' | 'dirty' | 'syncing' | 'synced' | 'error'>('idle');
  const [includeDocumentationInExport, setIncludeDocumentationInExport] = useState(false);

  const visualConfig = useMemo(() => ThemeTypes.resolveThemeVisualConfig(appTheme, mode), [appTheme, mode]);
  const showDiagram = useMemo(() => ({
    ...EMPTY_SHOW_DIAGRAM,
    [VISUALIZATION_SECTIONS.find((section) => section.id === selectedVisualization)?.showDiagramKey || 'sankey']: true
  }), [selectedVisualization]) as ShowDiagramState;

  const filteredMainSections = useMemo(() => {
    const normalizedQuery = normalizeSearchValue(sectionSearch.trim());
    if (!normalizedQuery) {
      return MAIN_SECTIONS;
    }
    return MAIN_SECTIONS.filter((section) => normalizeSearchValue(t(section.translationKey)).startsWith(normalizedQuery));
  }, [sectionSearch, t]);

  const filteredVisualizationSections = useMemo(() => {
    const normalizedQuery = normalizeSearchValue(sectionSearch.trim());
    if (!normalizedQuery) {
      return VISUALIZATION_SECTIONS;
    }
    return VISUALIZATION_SECTIONS.filter((section) => normalizeSearchValue(t(section.translationKey)).startsWith(normalizedQuery));
  }, [sectionSearch, t]);

  const findMatchingScheme = useMemo(() => {
    const activeColors = appTheme.visualizations.sankey.light.colors;
    const foundEntry = Object.entries(colorPalette).find(
      ([, paletteColors]) => JSON.stringify(paletteColors) === JSON.stringify(activeColors)
    );
    return foundEntry?.[0] ?? null;
  }, [appTheme.visualizations.sankey.light.colors, colorPalette]);

  useEffect(() => {
    setSelectedSchemeName(findMatchingScheme || appTheme.presetId || null);
  }, [appTheme.presetId, findMatchingScheme]);

  useEffect(() => {
    if (hasResolvedInitialModeRef.current) {
      return;
    }

    if (resolvedTheme === 'dark' || resolvedTheme === 'light') {
      setMode(resolvedTheme);
      hasResolvedInitialModeRef.current = true;
    }
  }, [resolvedTheme]);

  useEffect(() => {
    if (activeSection === 'advanced') {
      setJsonDraft(JSON.stringify(ThemeTypes.normalizeAppThemeConfig(appTheme), null, 2));
      setJsonError(null);
    }
  }, [activeSection, appTheme]);

  useEffect(() => {
    if (!themeSyncMountedRef.current) {
      themeSyncMountedRef.current = true;
      return undefined;
    }

    if (themeSyncTimerRef.current) {
      clearTimeout(themeSyncTimerRef.current);
    }

    themeSyncTimerRef.current = setTimeout(() => {
      void syncVisualizationThemes(activeTheme as unknown as Record<string, unknown>);
    }, 1000);

    return () => {
      if (themeSyncTimerRef.current) {
        clearTimeout(themeSyncTimerRef.current);
      }
    };
  }, [activeTheme]);

  useEffect(() => {
    if (!appThemeSyncMountedRef.current) {
      appThemeSyncMountedRef.current = true;
      return undefined;
    }

    setSyncState('dirty');

    if (appThemeSyncTimerRef.current) {
      clearTimeout(appThemeSyncTimerRef.current);
    }

    appThemeSyncTimerRef.current = setTimeout(() => {
      const themeToSave = ThemeTypes.normalizeAppThemeConfig(appTheme);
      setSyncState('syncing');
      void saveUserThemeConfig(themeToSave).then((savedTheme) => {
        setSyncState(savedTheme ? 'synced' : 'error');
      });
    }, 1600);

    return () => {
      if (appThemeSyncTimerRef.current) {
        clearTimeout(appThemeSyncTimerRef.current);
      }
    };
  }, [appTheme]);

  const dispatchThemeConfig = (nextTheme: ThemeTypes.AppThemeConfig, touch = true) => {
    const normalizedTheme = ThemeTypes.normalizeAppThemeConfig(nextTheme);
    appThemeDispatch?.({ type: 'set', themeConfig: normalizedTheme, touch });
    themeDispatch?.({ type: 'apply', modifiedData: normalizedTheme.visualizations });
  };

  const updateTheme = (updater: (theme: ThemeTypes.AppThemeConfig) => ThemeTypes.AppThemeConfig) => {
    if (!appThemeDispatch) {
      return;
    }

    dispatchThemeConfig(updater(cloneTheme(appTheme)));
    setFeedback(null);
  };

  const updateVisualConfig = (updater: (visual: ThemeTypes.ThemeVisualConfig) => ThemeTypes.ThemeVisualConfig) => {
    updateTheme((currentTheme) => {
      const nextTheme = cloneTheme(currentTheme);
      const nextVisual = updater(ThemeTypes.resolveThemeVisualConfig(nextTheme, mode));

      if (mode === 'light') {
        nextTheme.global = nextVisual.global;
        nextTheme.layout = nextVisual.layout;
        nextTheme.navigation = nextVisual.navigation;
        nextTheme.components = nextVisual.components;
        nextTheme.pages = nextVisual.pages;
      } else {
        nextTheme.modes.dark = nextVisual;
      }

      return nextTheme;
    });
  };

  const handleApplyTheme = (themeName: string) => {
    const palette = colorPalette[themeName];
    if (!palette) {
      return;
    }

    const nextTheme = makePresetTheme(appTheme, themeName, palette);
    dispatchThemeConfig(nextTheme);
    setSelectedSchemeName(themeName);
    setFeedback(t('theme.feedback.presetApplied'));
  };

  const applyPaletteToGlobal = (paletteName: string, colors: string[]) => {
    updateTheme((currentTheme) => makePresetTheme(currentTheme, paletteName, colors));
    setSelectedSchemeName(paletteName);
    setFeedback(t('theme.feedback.paletteApplied'));
  };

  const applyPaletteToComponents = (paletteName: string, colors: string[]) => {
    const [primary, secondary, accent, error, info, warning, success] = colors;
    updateVisualConfig((visual) => ({
      ...visual,
      components: {
        ...visual.components,
        button: {
          ...visual.components.button,
          primaryBackground: primary || visual.components.button.primaryBackground,
          secondaryBackground: secondary || visual.components.button.secondaryBackground
        },
        badge: {
          ...visual.components.badge,
          background: primary || visual.components.badge.background,
          error: error || visual.components.badge.error,
          info: info || visual.components.badge.info,
          warning: warning || visual.components.badge.warning,
          success: success || visual.components.badge.success
        },
        table: {
          ...visual.components.table,
          headerBackground: secondary || visual.components.table.headerBackground,
          headerForeground: primary || visual.components.table.headerForeground,
          rowHoverBackground: accent || visual.components.table.rowHoverBackground,
          selectedRowBackground: primary || visual.components.table.selectedRowBackground,
          border: accent || visual.components.table.border
        },
        tabs: {
          ...visual.components.tabs,
          listBackground: secondary || visual.components.tabs.listBackground,
          activeBackground: accent || visual.components.tabs.activeBackground,
          activeForeground: primary || visual.components.tabs.activeForeground
        }
      }
    }));
    setSelectedSchemeName(paletteName);
    setFeedback(t('theme.feedback.paletteApplied'));
  };

  const applyPaletteToSelectedPage = (paletteName: string, colors: string[]) => {
    const [primary, secondary, accent, error, info, warning, success] = colors;
    updateVisualConfig((visual) => ({
      ...visual,
      pages: {
        ...visual.pages,
        [selectedPage]: {
          ...visual.pages[selectedPage],
          background: secondary || visual.pages[selectedPage].background,
          surface: accent || visual.pages[selectedPage].surface,
          accent: primary || visual.pages[selectedPage].accent,
          border: primary || visual.pages[selectedPage].border,
          palettes: {
            ...visual.pages[selectedPage].palettes,
            [mode]: { colors: [...colors] }
          },
          components: {
            ...visual.pages[selectedPage].components,
            button: {
              ...visual.pages[selectedPage].components.button,
              primaryBackground: primary || visual.pages[selectedPage].components.button.primaryBackground,
              primaryForeground: secondary || visual.pages[selectedPage].components.button.primaryForeground,
              secondaryBackground: accent || visual.pages[selectedPage].components.button.secondaryBackground,
              secondaryForeground: primary || visual.pages[selectedPage].components.button.secondaryForeground
            },
            input: {
              ...visual.pages[selectedPage].components.input,
              background: secondary || visual.pages[selectedPage].components.input.background,
              foreground: primary || visual.pages[selectedPage].components.input.foreground,
              border: accent || visual.pages[selectedPage].components.input.border
            },
            card: {
              ...visual.pages[selectedPage].components.card,
              background: secondary || visual.pages[selectedPage].components.card.background,
              foreground: primary || visual.pages[selectedPage].components.card.foreground,
              border: accent || visual.pages[selectedPage].components.card.border
            },
            table: {
              ...visual.pages[selectedPage].components.table,
              headerBackground: secondary || visual.pages[selectedPage].components.table.headerBackground,
              headerForeground: primary || visual.pages[selectedPage].components.table.headerForeground,
              rowHoverBackground: info || visual.pages[selectedPage].components.table.rowHoverBackground,
              selectedRowBackground: success || visual.pages[selectedPage].components.table.selectedRowBackground,
              border: warning || visual.pages[selectedPage].components.table.border,
              mutedCellForeground: error || visual.pages[selectedPage].components.table.mutedCellForeground
            }
          }
        }
      }
    }));
    setSelectedSchemeName(paletteName);
    setFeedback(t('theme.feedback.pagePaletteApplied'));
  };

  const applyPaletteToSelectedVisualization = (paletteName: string, colors: string[]) => {
    updateTheme((currentTheme) => {
      const nextTheme = cloneTheme(currentTheme);
      nextTheme.visualizations[selectedVisualization][mode].colors = [...colors];
      nextTheme.presetId = paletteName;
      return nextTheme;
    });
    setSelectedSchemeName(paletteName);
    setFeedback(t('theme.feedback.visualizationPaletteApplied'));
  };

  const handleColorChange = (
    newColor: string,
    index: number,
    visualization: string,
    theme: string
  ) => {
    updateTheme((currentTheme) => {
      const nextTheme = cloneTheme(currentTheme);
      const visualizationKey = visualization as ThemeTypes.VisualizationThemeId;
      const themeKey = theme as ThemeTypes.ThemeMode;
      const colors = nextTheme.visualizations[visualizationKey]?.[themeKey]?.colors;
      if (colors?.[index] !== undefined) {
        colors[index] = newColor;
      }
      nextTheme.presetId = 'custom';
      return nextTheme;
    });
    setSelectedSchemeName(null);
  };

  const handleColorAdd = (visualization: string, theme: string) => {
    updateTheme((currentTheme) => {
      const nextTheme = cloneTheme(currentTheme);
      const visualizationKey = visualization as ThemeTypes.VisualizationThemeId;
      const themeKey = theme as ThemeTypes.ThemeMode;
      nextTheme.visualizations[visualizationKey]?.[themeKey]?.colors.push('#FFFFFF');
      nextTheme.presetId = 'custom';
      return nextTheme;
    });
    setSelectedSchemeName(null);
  };

  const handleColorDelete = (visualization: string, theme: string) => {
    updateTheme((currentTheme) => {
      const nextTheme = cloneTheme(currentTheme);
      const visualizationKey = visualization as ThemeTypes.VisualizationThemeId;
      const themeKey = theme as ThemeTypes.ThemeMode;
      const colors = nextTheme.visualizations[visualizationKey]?.[themeKey]?.colors;
      if (colors && colors.length > 3) {
        colors.pop();
      }
      nextTheme.presetId = 'custom';
      return nextTheme;
    });
    setSelectedSchemeName(null);
  };

  const saveTheme = async () => {
    const normalizedTheme = ThemeTypes.normalizeAppThemeConfig(appTheme);
    const savedTheme = await saveUserThemeConfig(normalizedTheme);
    if (!savedTheme) {
      toast.error(t('theme.toast.saveError'));
      return;
    }

    dispatchThemeConfig(savedTheme, false);
    setSyncState('synced');
    setFeedback(t('theme.feedback.saved'));
    toast.success(t('theme.toast.saved'));
  };

  const resetTheme = async () => {
    if (!window.confirm(t('theme.confirm.reset'))) {
      return;
    }

    const resetThemeConfig = await resetUserThemeConfig();
    const normalizedTheme = ThemeTypes.normalizeAppThemeConfig(resetThemeConfig || undefined);
    dispatchThemeConfig(normalizedTheme);
    setSelectedSchemeName('default');
    setFeedback(t('theme.feedback.defaultRestored'));
    toast.success(t('theme.toast.defaultRestored'));
  };

  const applyJsonDraft = (draft: string, source: 'advanced' | 'import') => {
    try {
      const parsed = JSON.parse(draft) as Record<string, unknown>;
      const normalizedTheme = ThemeTypes.normalizeAppThemeConfig(parsed);
      dispatchThemeConfig(normalizedTheme);
      setSelectedSchemeName(normalizedTheme.presetId);
      setFeedback(source === 'advanced' ? t('theme.feedback.jsonApplied') : t('theme.feedback.importApplied'));
      if (source === 'advanced') {
        setJsonError(null);
        setJsonDraft(JSON.stringify(normalizedTheme, null, 2));
      } else {
        setImportError(null);
      }
      toast.success(source === 'advanced' ? t('theme.toast.jsonValid') : t('theme.toast.imported'));
    } catch (error) {
      const message = error instanceof Error ? error.message : t('theme.error.invalidJson');
      if (source === 'advanced') {
        setJsonError(message);
      } else {
        setImportError(message);
      }
    }
  };

  const buildExportJson = () => {
    const normalizedTheme = ThemeTypes.normalizeAppThemeConfig(appTheme);
    const exportPayload = includeDocumentationInExport
      ? {
        ...normalizedTheme,
        _documentation: ThemeTypes.THEME_CONFIG_DOCUMENTATION
      }
      : normalizedTheme;

    return JSON.stringify(exportPayload, null, 2);
  };

  const copyExport = async () => {
    const exportJson = buildExportJson();
    await navigator.clipboard.writeText(exportJson);
    toast.success(t('theme.toast.copied'));
  };

  const downloadExport = () => {
    const exportJson = buildExportJson();
    const blob = new Blob([exportJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'illustry-theme.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    const text = await file.text();
    setImportDraft(text);
    applyJsonDraft(text, 'import');
  };

  const renderGlobalControls = () => (
    <div className="grid gap-5">
      <SectionHeader title={t('theme.section.global')} description={t('theme.description.global')} />
      <PaletteSelector
        palettes={colorPalette}
        label={t('theme.palette.globalLabel')}
        description={t('theme.palette.globalDescription')}
        applyLabel={t('theme.palette.apply')}
        onApply={applyPaletteToGlobal}
      />
      <ThemeModeTabs mode={mode} onChange={setMode} lightLabel={t("theme.light")} darkLabel={t("theme.dark")} />
      <div className="grid gap-4 md:grid-cols-2">
        {([
          ['background', 'background'],
          ['foreground', 'foreground'],
          ['primary', 'primary'],
          ['primaryForeground', 'primaryForeground'],
          ['secondary', 'secondary'],
          ['secondaryForeground', 'secondaryForeground'],
          ['accent', 'accent'],
          ['accentForeground', 'accentForeground'],
          ['muted', 'muted'],
          ['mutedForeground', 'mutedForeground'],
          ['border', 'border'],
          ['input', 'input'],
          ['error', 'error'],
          ['success', 'success'],
          ['warning', 'warning'],
          ['info', 'info']
        ] as Array<[keyof ThemeTypes.ThemeGlobalTokens, string]>).map(([key, label]) => (
          <ColorField
            key={key}
            id={`global-${mode}-${key}`}
            label={t(getTokenLabelKey(label))}
            value={visualConfig.global[key]}
            fallback={ThemeTypes.resolveThemeVisualConfig(ThemeTypes.DEFAULT_APP_THEME_CONFIG, mode).global[key]}
            onChange={(value) => updateVisualConfig((visual) => ({
              ...visual,
              global: {
                ...visual.global,
                [key]: value
              }
            }))}
          />
        ))}
      </div>
    </div>
  );

  const renderLayoutControls = () => (
    <div className="grid gap-5">
      <SectionHeader title={t('theme.section.layout')} description={t('theme.description.layout')} />
      <ThemeModeTabs mode={mode} onChange={setMode} lightLabel={t("theme.light")} darkLabel={t("theme.dark")} />
      <div className="grid gap-4 md:grid-cols-2">
        {([
          ['pageBackground', 'pageBackground'],
          ['surface', 'surface'],
          ['sectionBackground', 'sectionBackground']
        ] as Array<[keyof ThemeTypes.ThemeLayoutTokens, string]>).map(([key, label]) => (
          <ColorField
            key={key}
            id={`layout-${mode}-${key}`}
            label={t(getTokenLabelKey(label))}
            value={visualConfig.layout[key]}
            fallback={ThemeTypes.resolveThemeVisualConfig(ThemeTypes.DEFAULT_APP_THEME_CONFIG, mode).layout[key]}
            onChange={(value) => updateVisualConfig((visual) => ({
              ...visual,
              layout: {
                ...visual.layout,
                [key]: value
              }
            }))}
          />
        ))}
        <TextTokenField
          id={`layout-${mode}-radius`}
          label={t('theme.token.radius')}
          value={visualConfig.layout.radius}
          onChange={(value) => updateVisualConfig((visual) => ({
            ...visual,
            layout: { ...visual.layout, radius: value }
          }))}
        />
        <TextTokenField
          id={`layout-${mode}-shadow`}
          label={t('theme.token.shadow')}
          value={visualConfig.layout.shadow}
          onChange={(value) => updateVisualConfig((visual) => ({
            ...visual,
            layout: { ...visual.layout, shadow: value }
          }))}
        />
      </div>
    </div>
  );

  const renderNavigationControls = () => (
    <div className="grid gap-5">
      <SectionHeader title={t('theme.section.navigation')} description={t('theme.description.navigation')} />
      <ThemeModeTabs mode={mode} onChange={setMode} lightLabel={t("theme.light")} darkLabel={t("theme.dark")} />
      <Tabs defaultValue="sidebar">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sidebar">{t('theme.navigation.sidebar')}</TabsTrigger>
          <TabsTrigger value="header">{t('theme.navigation.header')}</TabsTrigger>
        </TabsList>
        <TabsContent value="sidebar" className="grid gap-4 pt-4 md:grid-cols-2">
          {([
            ['background', 'background'],
            ['foreground', 'foreground'],
            ['mutedForeground', 'mutedForeground'],
            ['activeBackground', 'activeBackground'],
            ['activeForeground', 'activeForeground'],
            ['hoverBackground', 'hoverBackground'],
            ['hoverForeground', 'hoverForeground'],
            ['border', 'border'],
            ['icon', 'icon'],
            ['activeIcon', 'activeIcon'],
            ['menuBackground', 'menuBackground'],
            ['menuForeground', 'menuForeground'],
            ['menuBorder', 'menuBorder'],
            ['menuHoverBackground', 'menuHoverBackground']
          ] as Array<[keyof ThemeTypes.ThemeNavigationTokens['sidebar'], string]>).map(([key, label]) => (
            <ColorField
              key={key}
              id={`nav-sidebar-${mode}-${key}`}
              label={t(getTokenLabelKey(label))}
              value={visualConfig.navigation.sidebar[key]}
              fallback={ThemeTypes.resolveThemeVisualConfig(ThemeTypes.DEFAULT_APP_THEME_CONFIG, mode).navigation.sidebar[key]}
              onChange={(value) => updateVisualConfig((visual) => ({
                ...visual,
                navigation: {
                  ...visual.navigation,
                  sidebar: { ...visual.navigation.sidebar, [key]: value }
                }
              }))}
            />
          ))}
        </TabsContent>
        <TabsContent value="header" className="grid gap-4 pt-4 md:grid-cols-2">
          {([
            ['background', 'background'],
            ['foreground', 'foreground'],
            ['mutedForeground', 'mutedForeground'],
            ['activeBackground', 'activeBackground'],
            ['activeForeground', 'activeForeground'],
            ['hoverBackground', 'hoverBackground'],
            ['hoverForeground', 'hoverForeground'],
            ['border', 'border'],
            ['icon', 'icon'],
            ['activeIcon', 'activeIcon'],
            ['menuBackground', 'menuBackground'],
            ['menuForeground', 'menuForeground'],
            ['menuBorder', 'menuBorder'],
            ['menuHoverBackground', 'menuHoverBackground']
          ] as Array<[keyof ThemeTypes.ThemeNavigationTokens['header'], string]>).map(([key, label]) => (
            <ColorField
              key={key}
              id={`nav-header-${mode}-${key}`}
              label={t(getTokenLabelKey(label))}
              value={visualConfig.navigation.header[key]}
              fallback={ThemeTypes.resolveThemeVisualConfig(ThemeTypes.DEFAULT_APP_THEME_CONFIG, mode).navigation.header[key]}
              onChange={(value) => updateVisualConfig((visual) => ({
                ...visual,
                navigation: {
                  ...visual.navigation,
                  header: { ...visual.navigation.header, [key]: value }
                }
              }))}
            />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderComponentControls = () => (
    <div className="grid gap-5">
      <SectionHeader title={t('theme.section.components')} description={t('theme.description.components')} />
      <PaletteSelector
        palettes={colorPalette}
        label={t('theme.palette.componentsLabel')}
        description={t('theme.palette.componentsDescription')}
        applyLabel={t('theme.palette.apply')}
        onApply={applyPaletteToComponents}
      />
      <ThemeModeTabs mode={mode} onChange={setMode} lightLabel={t("theme.light")} darkLabel={t("theme.dark")} />
      <Tabs defaultValue="button">
        <TabsList className="grid w-full grid-cols-4 md:grid-cols-8">
          {Object.keys(visualConfig.components).map((componentName) => (
            <TabsTrigger key={componentName} value={componentName} className="capitalize">
              {t(`theme.component.${componentName}`)}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="button" className="grid gap-4 pt-4 md:grid-cols-2">
          <ColorField
            id={`component-button-${mode}-primary`}
            label={t('theme.token.primaryBackground')}
            value={visualConfig.components.button.primaryBackground}
            fallback={ThemeTypes.resolveThemeVisualConfig(ThemeTypes.DEFAULT_APP_THEME_CONFIG, mode).components.button.primaryBackground}
            onChange={(value) => updateVisualConfig((visual) => ({
              ...visual,
              components: {
                ...visual.components,
                button: { ...visual.components.button, primaryBackground: value }
              }
            }))}
          />
          <ColorField
            id={`component-button-${mode}-primary-text`}
            label={t('theme.token.primaryForeground')}
            value={visualConfig.components.button.primaryForeground}
            fallback={ThemeTypes.resolveThemeVisualConfig(ThemeTypes.DEFAULT_APP_THEME_CONFIG, mode).components.button.primaryForeground}
            onChange={(value) => updateVisualConfig((visual) => ({
              ...visual,
              components: {
                ...visual.components,
                button: { ...visual.components.button, primaryForeground: value }
              }
            }))}
          />
          <ColorField
            id={`component-button-${mode}-secondary`}
            label={t('theme.token.secondaryBackground')}
            value={visualConfig.components.button.secondaryBackground}
            fallback={ThemeTypes.resolveThemeVisualConfig(ThemeTypes.DEFAULT_APP_THEME_CONFIG, mode).components.button.secondaryBackground}
            onChange={(value) => updateVisualConfig((visual) => ({
              ...visual,
              components: {
                ...visual.components,
                button: { ...visual.components.button, secondaryBackground: value }
              }
            }))}
          />
          <TextTokenField
            id={`component-button-${mode}-radius`}
            label={t('theme.token.radius')}
            value={visualConfig.components.button.radius}
            onChange={(value) => updateVisualConfig((visual) => ({
              ...visual,
              components: {
                ...visual.components,
                button: { ...visual.components.button, radius: value }
              }
            }))}
          />
        </TabsContent>
        {(['input', 'card', 'modal', 'popover'] as const).map((componentName) => (
          <TabsContent key={componentName} value={componentName} className="grid gap-4 pt-4 md:grid-cols-2">
            {(['background', 'foreground', 'border'] as const).map((key) => (
              <ColorField
                key={key}
                id={`component-${componentName}-${mode}-${key}`}
                label={t(getTokenLabelKey(key))}
                value={visualConfig.components[componentName][key]}
                fallback={ThemeTypes.resolveThemeVisualConfig(ThemeTypes.DEFAULT_APP_THEME_CONFIG, mode).components[componentName][key]}
                onChange={(value) => updateVisualConfig((visual) => ({
                  ...visual,
                  components: {
                    ...visual.components,
                    [componentName]: {
                      ...visual.components[componentName],
                      [key]: value
                    }
                  }
                }))}
              />
            ))}
          </TabsContent>
        ))}
        <TabsContent value="badge" className="grid gap-4 pt-4 md:grid-cols-2">
          {(['background', 'foreground', 'success', 'warning', 'error', 'info'] as const).map((key) => (
            <ColorField
              key={key}
              id={`component-badge-${mode}-${key}`}
              label={t(getTokenLabelKey(key))}
              value={visualConfig.components.badge[key]}
              fallback={ThemeTypes.resolveThemeVisualConfig(ThemeTypes.DEFAULT_APP_THEME_CONFIG, mode).components.badge[key]}
              onChange={(value) => updateVisualConfig((visual) => ({
                ...visual,
                components: {
                  ...visual.components,
                  badge: { ...visual.components.badge, [key]: value }
                }
              }))}
            />
          ))}
        </TabsContent>
        <TabsContent value="table" className="grid gap-4 pt-4 md:grid-cols-2">
          {([
            'background',
            'headerBackground',
            'headerForeground',
            'rowBackground',
            'alternatingRowBackground',
            'rowHoverBackground',
            'selectedRowBackground',
            'border',
            'cellForeground',
            'mutedCellForeground',
            'paginationBackground',
            'paginationForeground',
            'emptyStateForeground'
          ] as const).map((key) => (
            <ColorField
              key={key}
              id={`component-table-${mode}-${key}`}
              label={t(getTokenLabelKey(key))}
              value={visualConfig.components.table[key]}
              fallback={ThemeTypes.resolveThemeVisualConfig(ThemeTypes.DEFAULT_APP_THEME_CONFIG, mode).components.table[key]}
              onChange={(value) => updateVisualConfig((visual) => ({
                ...visual,
                components: {
                  ...visual.components,
                  table: { ...visual.components.table, [key]: value }
                }
              }))}
            />
          ))}
        </TabsContent>
        <TabsContent value="tabs" className="grid gap-4 pt-4 md:grid-cols-2">
          {(['listBackground', 'activeBackground', 'activeForeground', 'inactiveForeground'] as const).map((key) => (
            <ColorField
              key={key}
              id={`component-tabs-${mode}-${key}`}
              label={t(getTokenLabelKey(key))}
              value={visualConfig.components.tabs[key]}
              fallback={ThemeTypes.resolveThemeVisualConfig(ThemeTypes.DEFAULT_APP_THEME_CONFIG, mode).components.tabs[key]}
              onChange={(value) => updateVisualConfig((visual) => ({
                ...visual,
                components: {
                  ...visual.components,
                  tabs: { ...visual.components.tabs, [key]: value }
                }
              }))}
            />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderPagesControls = () => {
    const selectedPageConfig = visualConfig.pages[selectedPage] || {};
    const defaultVisual = ThemeTypes.resolveThemeVisualConfig(ThemeTypes.DEFAULT_APP_THEME_CONFIG, mode);

    return (
      <div className="grid gap-5">
        <SectionHeader title={t('theme.section.pages')} description={t('theme.description.pages')} />
        <PaletteSelector
          palettes={colorPalette}
          label={t('theme.palette.pagesLabel')}
          description={t('theme.palette.pagesDescription')}
          applyLabel={t('theme.palette.apply')}
          onApply={applyPaletteToSelectedPage}
        />
        <ThemeModeTabs mode={mode} onChange={setMode} lightLabel={t("theme.light")} darkLabel={t("theme.dark")} />
        <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
          <div className="grid gap-2">
            {ThemeTypes.APP_THEME_PAGES.map((page) => (
              <button
                type="button"
                key={page.id}
                onClick={() => setSelectedPage(page.id)}
                className={`rounded-md border px-3 py-2 text-left text-sm transition ${
                  selectedPage === page.id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background hover:bg-accent'
                }`}
              >
                <span className="block font-medium">{t(getPageLabelKey(page.id))}</span>
                <span className="block truncate text-xs opacity-75">{page.path}</span>
              </button>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <ColorField
              id={`page-${selectedPage}-${mode}-background`}
              label={t('theme.token.pageBackground')}
              value={selectedPageConfig.background}
              fallback={visualConfig.layout.pageBackground || defaultVisual.layout.pageBackground}
              optional
              clearLabel={t('theme.action.useFallback')}
              onClear={() => updateVisualConfig((visual) => ({
                ...visual,
                pages: {
                  ...visual.pages,
                  [selectedPage]: {
                    ...visual.pages[selectedPage],
                    background: ''
                  }
                }
              }))}
              onChange={(value) => updateVisualConfig((visual) => ({
                ...visual,
                pages: {
                  ...visual.pages,
                  [selectedPage]: {
                    ...visual.pages[selectedPage],
                    background: value
                  }
                }
              }))}
            />
            <ColorField
              id={`page-${selectedPage}-${mode}-surface`}
              label={t('theme.token.surface')}
              value={selectedPageConfig.surface}
              fallback={visualConfig.layout.surface || defaultVisual.layout.surface}
              optional
              clearLabel={t('theme.action.useFallback')}
              onClear={() => updateVisualConfig((visual) => ({
                ...visual,
                pages: {
                  ...visual.pages,
                  [selectedPage]: {
                    ...visual.pages[selectedPage],
                    surface: ''
                  }
                }
              }))}
              onChange={(value) => updateVisualConfig((visual) => ({
                ...visual,
                pages: {
                  ...visual.pages,
                  [selectedPage]: {
                    ...visual.pages[selectedPage],
                    surface: value
                  }
                }
              }))}
            />
            <ColorField
              id={`page-${selectedPage}-${mode}-accent`}
              label={t('theme.token.accent')}
              value={selectedPageConfig.accent}
              fallback={visualConfig.global.accent || defaultVisual.global.accent}
              optional
              clearLabel={t('theme.action.useFallback')}
              onClear={() => updateVisualConfig((visual) => ({
                ...visual,
                pages: {
                  ...visual.pages,
                  [selectedPage]: {
                    ...visual.pages[selectedPage],
                    accent: ''
                  }
                }
              }))}
              onChange={(value) => updateVisualConfig((visual) => ({
                ...visual,
                pages: {
                  ...visual.pages,
                  [selectedPage]: {
                    ...visual.pages[selectedPage],
                    accent: value
                  }
                }
              }))}
            />
            <div className="md:col-span-2 rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
              {t('theme.docs.pageComponents')}
            </div>
            {([
              'primaryBackground',
              'primaryForeground',
              'secondaryBackground',
              'secondaryForeground'
            ] as const).map((key) => (
              <ColorField
                key={key}
                id={`page-${selectedPage}-${mode}-button-${key}`}
                label={`${t('theme.component.button')} ${t(getTokenLabelKey(key))}`}
                value={selectedPageConfig.components.button[key]}
                fallback={visualConfig.components.button[key] || defaultVisual.components.button[key]}
                optional
                clearLabel={t('theme.action.useFallback')}
                onClear={() => updateVisualConfig((visual) => ({
                  ...visual,
                  pages: {
                    ...visual.pages,
                    [selectedPage]: {
                      ...visual.pages[selectedPage],
                      components: {
                        ...visual.pages[selectedPage].components,
                        button: {
                          ...visual.pages[selectedPage].components.button,
                          [key]: ''
                        }
                      }
                    }
                  }
                }))}
                onChange={(value) => updateVisualConfig((visual) => ({
                  ...visual,
                  pages: {
                    ...visual.pages,
                    [selectedPage]: {
                      ...visual.pages[selectedPage],
                      components: {
                        ...visual.pages[selectedPage].components,
                        button: {
                          ...visual.pages[selectedPage].components.button,
                          [key]: value
                        }
                      }
                    }
                  }
                }))}
              />
            ))}
            {(['background', 'foreground', 'border'] as const).map((key) => (
              <ColorField
                key={key}
                id={`page-${selectedPage}-${mode}-input-${key}`}
                label={`${t('theme.component.input')} ${t(getTokenLabelKey(key))}`}
                value={selectedPageConfig.components.input[key]}
                fallback={visualConfig.components.input[key] || defaultVisual.components.input[key]}
                optional
                clearLabel={t('theme.action.useFallback')}
                onClear={() => updateVisualConfig((visual) => ({
                  ...visual,
                  pages: {
                    ...visual.pages,
                    [selectedPage]: {
                      ...visual.pages[selectedPage],
                      components: {
                        ...visual.pages[selectedPage].components,
                        input: {
                          ...visual.pages[selectedPage].components.input,
                          [key]: ''
                        }
                      }
                    }
                  }
                }))}
                onChange={(value) => updateVisualConfig((visual) => ({
                  ...visual,
                  pages: {
                    ...visual.pages,
                    [selectedPage]: {
                      ...visual.pages[selectedPage],
                      components: {
                        ...visual.pages[selectedPage].components,
                        input: {
                          ...visual.pages[selectedPage].components.input,
                          [key]: value
                        }
                      }
                    }
                  }
                }))}
              />
            ))}
            {(['background', 'foreground', 'border'] as const).map((key) => (
              <ColorField
                key={key}
                id={`page-${selectedPage}-${mode}-card-${key}`}
                label={`${t('theme.component.card')} ${t(getTokenLabelKey(key))}`}
                value={selectedPageConfig.components.card[key]}
                fallback={visualConfig.components.card[key] || defaultVisual.components.card[key]}
                optional
                clearLabel={t('theme.action.useFallback')}
                onClear={() => updateVisualConfig((visual) => ({
                  ...visual,
                  pages: {
                    ...visual.pages,
                    [selectedPage]: {
                      ...visual.pages[selectedPage],
                      components: {
                        ...visual.pages[selectedPage].components,
                        card: {
                          ...visual.pages[selectedPage].components.card,
                          [key]: ''
                        }
                      }
                    }
                  }
                }))}
                onChange={(value) => updateVisualConfig((visual) => ({
                  ...visual,
                  pages: {
                    ...visual.pages,
                    [selectedPage]: {
                      ...visual.pages[selectedPage],
                      components: {
                        ...visual.pages[selectedPage].components,
                        card: {
                          ...visual.pages[selectedPage].components.card,
                          [key]: value
                        }
                      }
                    }
                  }
                }))}
              />
            ))}
            {([
              'background',
              'headerBackground',
              'headerForeground',
              'rowBackground',
              'alternatingRowBackground',
              'rowHoverBackground',
              'selectedRowBackground',
              'border',
              'cellForeground',
              'mutedCellForeground',
              'paginationBackground',
              'paginationForeground',
              'emptyStateForeground'
            ] as const).map((key) => (
              <ColorField
                key={key}
                id={`page-${selectedPage}-${mode}-table-${key}`}
                label={`${t('theme.component.table')} ${t(getTokenLabelKey(key))}`}
                value={selectedPageConfig.components.table[key]}
                fallback={visualConfig.components.table[key] || defaultVisual.components.table[key]}
                optional
                clearLabel={t('theme.action.useFallback')}
                onClear={() => updateVisualConfig((visual) => ({
                  ...visual,
                  pages: {
                    ...visual.pages,
                    [selectedPage]: {
                      ...visual.pages[selectedPage],
                      components: {
                        ...visual.pages[selectedPage].components,
                        table: {
                          ...visual.pages[selectedPage].components.table,
                          [key]: ''
                        }
                      }
                    }
                  }
                }))}
                onChange={(value) => updateVisualConfig((visual) => ({
                  ...visual,
                  pages: {
                    ...visual.pages,
                    [selectedPage]: {
                      ...visual.pages[selectedPage],
                      components: {
                        ...visual.pages[selectedPage].components,
                        table: {
                          ...visual.pages[selectedPage].components.table,
                          [key]: value
                        }
                      }
                    }
                  }
                }))}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (activeSection === 'presets') {
      return (
        <div className="grid gap-5">
          <SectionHeader title={t('theme.section.presets')} description={t('theme.description.presets')} />
          <DefaultThemesAccordion
            colorPalette={colorPalette}
            handleApplyTheme={handleApplyTheme}
            selectedSchemeName={selectedSchemeName}
          />
        </div>
      );
    }

    if (activeSection === 'global') {
      return renderGlobalControls();
    }

    if (activeSection === 'layout') {
      return renderLayoutControls();
    }

    if (activeSection === 'navigation') {
      return renderNavigationControls();
    }

    if (activeSection === 'components') {
      return renderComponentControls();
    }

    if (activeSection === 'pages') {
      return renderPagesControls();
    }

    if (activeSection === 'advanced') {
      return (
        <div className="grid gap-5">
          <SectionHeader title={t('theme.section.advanced')} description={t('theme.description.advanced')} />
          <Accordion type="single" collapsible>
            {Object.keys(ThemeTypes.THEME_CONFIG_DOCUMENTATION).map((key) => (
              <AccordionItem key={key} value={key}>
                <AccordionTrigger>{key}</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">{t(`theme.docs.${key}`)}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <Textarea
            data-testid="theme-json-editor"
            className="min-h-[520px] font-mono text-xs"
            value={jsonDraft}
            onChange={(event) => setJsonDraft(event.target.value)}
          />
          {jsonError && <p className="text-sm text-destructive">{jsonError}</p>}
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => applyJsonDraft(jsonDraft, 'advanced')}>
              {t('theme.action.validateJson')}
            </Button>
            <Button type="button" variant="outline" onClick={() => setJsonDraft(JSON.stringify(appTheme, null, 2))}>
              {t('theme.action.rebuildCurrent')}
            </Button>
          </div>
        </div>
      );
    }

    if (activeSection === 'importExport') {
      const exportJson = buildExportJson();

      return (
        <div className="grid gap-5">
          <SectionHeader title={t('theme.section.importExport')} description={t('theme.description.importExport')} />
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('theme.export.title')}</CardTitle>
                <CardDescription>{t('theme.export.description')}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={includeDocumentationInExport}
                    onCheckedChange={(checked) => setIncludeDocumentationInExport(checked === true)}
                  />
                  {t('theme.export.includeDocumentation')}
                </label>
                <Textarea readOnly className="min-h-[260px] font-mono text-xs" value={exportJson} />
                <div className="flex flex-wrap gap-2">
                  <Button type="button" onClick={copyExport}>
                    <Icons.copy className="mr-2 h-4 w-4" />
                    {t('theme.action.copy')}
                  </Button>
                  <Button type="button" variant="outline" onClick={downloadExport}>
                    <Icons.download className="mr-2 h-4 w-4" />
                    {t('theme.action.export')}
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t('theme.import.title')}</CardTitle>
                <CardDescription>{t('theme.import.description')}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <Input
                  type="file"
                  accept="application/json,.json"
                  onChange={(event) => void handleImportFile(event.target.files?.[0])}
                />
                <Textarea
                  className="min-h-[220px] font-mono text-xs"
                  value={importDraft}
                  onChange={(event) => setImportDraft(event.target.value)}
                  placeholder={t('theme.import.placeholder')}
                />
                {importError && <p className="text-sm text-destructive">{importError}</p>}
                <Button type="button" onClick={() => applyJsonDraft(importDraft, 'import')}>
                  {t('theme.action.importConfig')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    const selectedVisualizationLabel = t(
      VISUALIZATION_SECTIONS.find((section) => section.id === selectedVisualization)?.translationKey || 'theme.sankeyDiagram'
    );

    return (
      <div className="grid gap-5">
        <SectionHeader title={selectedVisualizationLabel} description={t('theme.description.visualizationPalettes')} />
        <PaletteSelector
          palettes={colorPalette}
          label={t('theme.palette.visualizationLabel')}
          description={t('theme.palette.visualizationDescription')}
          applyLabel={t('theme.palette.apply')}
          onApply={applyPaletteToSelectedVisualization}
        />
        <GenericThemesAccordion
          handleColorChange={handleColorChange}
          handleColorDelete={handleColorDelete}
          handleColorAdd={handleColorAdd}
          visualization={selectedVisualization}
        />
        {showDiagram && <VisualizationPreview selectedVisualization={selectedVisualization} />}
      </div>
    );
  };

  return (
    <div className={cn(embedded ? 'h-[calc(92vh-6rem)] bg-[hsl(var(--illustry-page-background))]' : 'min-h-[calc(100vh-4rem)] bg-[hsl(var(--illustry-page-background))]')}>
      <div className={cn('grid gap-4 p-4 xl:grid-cols-[230px_minmax(0,1fr)_420px]', embedded && 'h-full p-3')}>
        <aside className="rounded-lg border bg-background">
          <div className="border-b p-3">
            <Input
              value={sectionSearch}
              onChange={(event) => setSectionSearch(event.target.value)}
              placeholder={t('theme.searchTypes')}
              aria-label={t('theme.searchTypes')}
              className="h-9"
            />
          </div>
          <ScrollArea className={embedded ? 'h-[calc(92vh-12rem)]' : 'h-[calc(100vh-9rem)]'}>
            <nav className="grid gap-1 p-2">
              {filteredMainSections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  className={`rounded-md px-3 py-2 text-left text-sm transition ${
                    activeSection === section.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent hover:text-accent-foreground'
                  }`}
                  onClick={() => setActiveSection(section.id)}
                >
                  {t(section.translationKey)}
                </button>
              ))}
              {filteredVisualizationSections.length > 0 && (
                <div className="mt-2 border-t pt-2">
                  <p className="px-3 pb-1 text-xs font-medium uppercase text-muted-foreground">{t('theme.section.visualizationPalettes')}</p>
                  {filteredVisualizationSections.map((section) => (
                    <button
                      key={section.id}
                      type="button"
                      className={`w-full rounded-md px-3 py-2 text-left text-sm transition ${
                        activeSection === 'visualizations' && selectedVisualization === section.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-accent hover:text-accent-foreground'
                      }`}
                      onClick={() => {
                        setSelectedVisualization(section.id);
                        setActiveSection('visualizations');
                      }}
                    >
                      {t(section.translationKey)}
                    </button>
                  ))}
                </div>
              )}
              {filteredMainSections.length === 0 && filteredVisualizationSections.length === 0 && (
                <p className="px-3 py-2 text-sm text-muted-foreground">{t('theme.noMatchingTypes')}</p>
              )}
            </nav>
          </ScrollArea>
        </aside>

        <main className="min-w-0 rounded-lg border bg-background p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{t('theme.badge.preset')}: {selectedSchemeName || t('theme.preset.custom')}</Badge>
              <Badge variant="outline">{t('theme.badge.mode')}: {t(mode === 'light' ? 'theme.light' : 'theme.dark')}</Badge>
              <Badge variant="outline">{t(`theme.sync.${syncState}`)}</Badge>
              {feedback && <span className="text-sm text-muted-foreground">{feedback}</span>}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={resetTheme}>
                <Icons.reset className="mr-2 h-4 w-4" />
                {t('theme.action.resetDefault')}
              </Button>
              <Button type="button" onClick={saveTheme}>
                <Icons.check className="mr-2 h-4 w-4" />
                {t('theme.action.save')}
              </Button>
            </div>
          </div>
          <ScrollArea className={embedded ? 'h-[calc(92vh-15rem)]' : 'h-auto xl:h-[calc(100vh-11rem)]'}>
            <div className="pr-1">{renderContent()}</div>
          </ScrollArea>
          <div className="mt-4 block xl:hidden">
            <Tabs defaultValue="components">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="components">{t('theme.preview.livePreview')}</TabsTrigger>
                <TabsTrigger value="visualization">{t('theme.preview.chartPreview')}</TabsTrigger>
              </TabsList>
              <TabsContent value="components" className="pt-3">
                <ThemePreview
                  config={appTheme}
                  mode={mode}
                  selectedPage={selectedPage}
                  selectedVisualization={selectedVisualization}
                  t={t}
                />
              </TabsContent>
              <TabsContent value="visualization" className="pt-3">
                <VisualizationPreview selectedVisualization={selectedVisualization} />
              </TabsContent>
            </Tabs>
          </div>
        </main>

        <aside className={cn('hidden xl:block', embedded && 'min-h-0')}>
          <div className={embedded ? 'h-[calc(92vh-12rem)]' : 'sticky top-20 h-[calc(100vh-6rem)]'}>
            <Tabs defaultValue="components" className="h-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="components">{t('theme.preview.livePreview')}</TabsTrigger>
                <TabsTrigger value="visualization">{t('theme.preview.chartPreview')}</TabsTrigger>
              </TabsList>
              <TabsContent value="components" className="h-[calc(100%-3rem)] pt-3">
                <ThemePreview
                  config={appTheme}
                  mode={mode}
                  selectedPage={selectedPage}
                  selectedVisualization={selectedVisualization}
                  t={t}
                />
              </TabsContent>
              <TabsContent value="visualization" className="h-[calc(100%-3rem)] pt-3">
                <VisualizationPreview selectedVisualization={selectedVisualization} />
              </TabsContent>
            </Tabs>
          </div>
        </aside>
      </div>
    </div>
  );
};

export type { ShowDiagramState };
export default ThemeShell;
