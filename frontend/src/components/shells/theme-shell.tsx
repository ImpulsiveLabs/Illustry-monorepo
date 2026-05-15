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
  nextTheme.presetId = presetId;
  nextTheme.visualizations = ThemeTypes.createVisualizationThemes(colors);
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
  const [importDraft, setImportDraft] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [syncState, setSyncState] = useState<'idle' | 'dirty' | 'syncing' | 'synced' | 'error'>('idle');
  const [includeDocumentationInExport, setIncludeDocumentationInExport] = useState(false);

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

  const applyJsonDraft = (draft: string) => {
    try {
      const parsed = JSON.parse(draft) as Record<string, unknown>;
      const normalizedTheme = ThemeTypes.normalizeAppThemeConfig(
        parsed.visualizations
          ? { visualizations: parsed.visualizations as ThemeTypes.VisualizationThemeConfig, presetId: parsed.presetId as string | undefined }
          : parsed
      );
      dispatchThemeConfig(normalizedTheme);
      setSelectedSchemeName(normalizedTheme.presetId);
      setFeedback(t('theme.feedback.importApplied'));
      setImportError(null);
      toast.success(t('theme.toast.imported'));
    } catch (error) {
      const message = error instanceof Error ? error.message : t('theme.error.invalidJson');
      setImportError(message);
    }
  };

  const buildExportJson = () => {
    const normalizedTheme = ThemeTypes.normalizeAppThemeConfig(appTheme);
    const exportPayload = {
      version: normalizedTheme.version,
      presetId: normalizedTheme.presetId,
      visualizations: normalizedTheme.visualizations,
      ...(includeDocumentationInExport
        ? { _documentation: ThemeTypes.THEME_CONFIG_DOCUMENTATION.visualizations }
        : {})
    };

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
    link.download = 'illustry-visualization-palettes.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    const text = await file.text();
    setImportDraft(text);
    applyJsonDraft(text);
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
                <Button type="button" onClick={() => applyJsonDraft(importDraft)}>
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
      </div>
    );
  };

  return (
    <div className={cn(embedded ? 'h-[calc(92vh-6rem)] bg-background' : 'min-h-[calc(100vh-4rem)] bg-background')}>
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
          <p className="mb-4 text-sm text-muted-foreground">{t('theme.scopeHelper')}</p>
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
        </main>

        <aside className={cn('min-w-0', embedded && 'min-h-0')}>
          <div className={embedded ? 'h-[calc(92vh-12rem)]' : 'sticky top-20 h-[calc(100vh-6rem)]'}>
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="mb-3 text-sm font-medium text-foreground">{t('theme.preview.chartPreview')}</p>
              <VisualizationPreview selectedVisualization={selectedVisualization} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export type { ShowDiagramState };
export default ThemeShell;
