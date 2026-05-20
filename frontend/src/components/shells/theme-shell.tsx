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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import Checkbox from '@/components/ui/checkbox';
import Fallback from '@/components/ui/fallback';
import Icons from '@/components/icons';
import { getRealtimeClientId } from '@/lib/realtime-client';
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

const normalizeSearchValue = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

const cloneTheme = (theme: ThemeTypes.AppThemeConfig) => JSON.parse(JSON.stringify(theme)) as ThemeTypes.AppThemeConfig;

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


const VisualizationPreview = ({
  selectedVisualization,
  embedded = false
}: {
  selectedVisualization: ThemeTypes.VisualizationThemeId;
  embedded?: boolean;
}) => {
  const wrapperClassName = embedded
    ? 'h-full min-h-0 w-full overflow-hidden rounded-lg border bg-background p-3 [&>*]:!mt-0 [&>*]:h-full [&>*]:w-full'
    : 'min-h-[360px] rounded-lg border bg-background p-3';
  const previewFullScreen = !embedded;

  switch (selectedVisualization) {
    case 'sankey':
      return (
        <div className={wrapperClassName}>
          <SankeyGraphShellView fullScreen={previewFullScreen} data={siteConfig.nodeLink} legend options={false} filter={false} />
        </div>
      );
    case 'calendar':
      return (
        <div className={wrapperClassName}>
          <Suspense fallback={<Fallback />}>
            <CalendarGraphShellView data={{ calendar: siteConfig.calendar }} legend options={false} filter={false} fullScreen={previewFullScreen} />
          </Suspense>
        </div>
      );
    case 'flg':
      return (
        <div className={wrapperClassName}>
          <Suspense fallback={<Fallback />}>
            <ForcedLayoutGraphShellView data={siteConfig.nodeLink} legend options={false} filter={false} fullScreen={previewFullScreen} />
          </Suspense>
        </div>
      );
    case 'wordcloud':
      return (
        <div className={wrapperClassName}>
          <Suspense fallback={<Fallback />}>
            <WordCloudShellView data={{ words: siteConfig.words }} legend options={false} filter={false} fullScreen={previewFullScreen} />
          </Suspense>
        </div>
      );
    case 'heb':
      return (
        <div className={wrapperClassName}>
          <Suspense fallback={<Fallback />}>
            <HierarchicalEdgeBundlingShellView data={siteConfig.nodeLink} legend options={false} filter={false} fullScreen={previewFullScreen} />
          </Suspense>
        </div>
      );
    case 'lineChart':
      return (
        <div className={wrapperClassName}>
          <Suspense fallback={<Fallback />}>
            <AxisChartsShellView data={siteConfig.axisChart} legend options={false} type="line" filter={false} fullScreen={previewFullScreen} />
          </Suspense>
        </div>
      );
    case 'barChart':
      return (
        <div className={wrapperClassName}>
          <Suspense fallback={<Fallback />}>
            <AxisChartsShellView data={siteConfig.axisChart} legend options={false} type="bar" filter={false} fullScreen={previewFullScreen} />
          </Suspense>
        </div>
      );
    case 'pieChart':
      return (
        <div className={wrapperClassName}>
          <Suspense fallback={<Fallback />}>
            <PieChartShellView data={siteConfig.pieChart} legend options={false} filter={false} fullScreen={previewFullScreen} />
          </Suspense>
        </div>
      );
    case 'funnel':
      return (
        <div className={wrapperClassName}>
          <Suspense fallback={<Fallback />}>
            <FunnelShellView data={siteConfig.funnel} legend options={false} filter={false} fullScreen={previewFullScreen} />
          </Suspense>
        </div>
      );
    case 'scatter':
      return (
        <div className={wrapperClassName}>
          <Suspense fallback={<Fallback />}>
            <ScatterShellView data={siteConfig.scatter as VisualizationTypes.ScatterData} legend options={false} filter={false} fullScreen={previewFullScreen} />
          </Suspense>
        </div>
      );
    case 'treeMap':
      return (
        <div className={wrapperClassName}>
          <Suspense fallback={<Fallback />}>
            <TreeMapShellView data={siteConfig.hierarchy as VisualizationTypes.HierarchyData} legend options={false} filter={false} fullScreen={previewFullScreen} />
          </Suspense>
        </div>
      );
    case 'sunburst':
      return (
        <div className={wrapperClassName}>
          <Suspense fallback={<Fallback />}>
            <SunBurstShellView data={siteConfig.hierarchy as VisualizationTypes.HierarchyData} legend options={false} filter={false} fullScreen={previewFullScreen} />
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
  const realtimeClientId = useMemo(() => getRealtimeClientId(), []);
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
      void syncVisualizationThemes(activeTheme as unknown as Record<string, unknown>, realtimeClientId);
    }, 1000);

    return () => {
      if (themeSyncTimerRef.current) {
        clearTimeout(themeSyncTimerRef.current);
      }
    };
  }, [activeTheme, realtimeClientId]);

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
      void saveUserThemeConfig(themeToSave, realtimeClientId).then((savedTheme) => {
        setSyncState(savedTheme ? 'synced' : 'error');
      });
    }, 1600);

    return () => {
      if (appThemeSyncTimerRef.current) {
        clearTimeout(appThemeSyncTimerRef.current);
      }
    };
  }, [appTheme, realtimeClientId]);

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
    const [savedTheme] = await Promise.all([
      saveUserThemeConfig(normalizedTheme, realtimeClientId),
      syncVisualizationThemes(normalizedTheme.visualizations as unknown as Record<string, unknown>, realtimeClientId)
    ]);
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

    const resetThemeConfig = await resetUserThemeConfig(realtimeClientId);
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
        <SectionHeader
          title={selectedVisualizationLabel}
          description="Override this visualization's colors only when it needs to differ from the general theme."
        />
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Color overrides</CardTitle>
            <CardDescription>
              These values affect only this visualization type. Leave them aligned with the general theme when no special treatment is needed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GenericThemesAccordion
              handleColorChange={handleColorChange}
              handleColorDelete={handleColorDelete}
              handleColorAdd={handleColorAdd}
              visualization={selectedVisualization}
            />
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className={cn(embedded ? 'min-h-0 flex-1 bg-background' : 'min-h-[calc(100vh-4rem)] bg-background')}>
      <div className={cn('grid gap-4 p-4 xl:grid-cols-[220px_minmax(360px,1fr)_640px]', embedded && 'h-full min-h-0 grid-rows-1 p-3')}>
        <aside className="flex min-h-0 flex-col rounded-lg border bg-background">
          <div className="shrink-0 border-b p-3">
            <Input
              value={sectionSearch}
              onChange={(event) => setSectionSearch(event.target.value)}
              placeholder={t('theme.searchTypes')}
              aria-label={t('theme.searchTypes')}
              className="h-9"
            />
          </div>
          <ScrollArea className={embedded ? 'min-h-0 flex-1' : 'h-[calc(100vh-9rem)]'}>
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
                  <p className="px-3 pb-1 text-xs font-medium uppercase text-muted-foreground">Visualization overrides</p>
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

        <main className="flex min-h-0 min-w-0 flex-col rounded-lg border bg-background p-4">
          <p className="mb-4 shrink-0 text-sm text-muted-foreground">{t('theme.scopeHelper')}</p>
          <div className="mb-4 grid shrink-0 gap-3 border-b pb-4">
            <div className="flex min-h-7 flex-wrap items-center gap-2">
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
          <ScrollArea className={embedded ? 'min-h-0 flex-1' : 'h-auto xl:h-[calc(100vh-11rem)]'}>
            <div className="pr-1">{renderContent()}</div>
          </ScrollArea>
        </main>

        <aside className={cn('min-w-0', embedded && 'min-h-0')}>
          <div className={embedded ? 'h-full min-h-0' : 'sticky top-20 h-[calc(100vh-6rem)]'}>
            <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border bg-muted/30 p-3">
              <p className="mb-3 shrink-0 text-sm font-medium text-foreground">{t('theme.preview.chartPreview')}</p>
              <div className="min-h-0 flex-1 overflow-hidden">
                <VisualizationPreview selectedVisualization={selectedVisualization} embedded={embedded} />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export type { ShowDiagramState };
export default ThemeShell;
