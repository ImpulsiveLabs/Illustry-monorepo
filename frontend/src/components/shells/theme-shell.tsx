/* eslint-disable @typescript-eslint/ban-ts-comment */

'use client';

import {
  Suspense, useEffect, useMemo, useState
} from 'react';
import { VisualizationTypes, UtilTypes } from '@illustry/types';
import siteConfig from '@/config/site';
import { useLocale } from '@/components/providers/locale-provider';
import Input from '@/components/ui/input';
import {
  ThemeColors,
  useThemeColors,
  useThemeColorsDispach
} from '../providers/theme-provider';
import {
  AccordionContent,
  Accordion,
  AccordionTrigger,
  AccordionItem
} from '../ui/accordion';
import DefaultThemesAccordion from '../ui/theme/default-themes';
import GenericThemesAccordion from '../ui/theme/generic-themes';
import { ScrollArea } from '../ui/scroll-area';
import Fallback from '../ui/fallback';
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

type ThemeSectionConfig = {
  id: string;
  showDiagramKey?: keyof ShowDiagramState;
  translationKey: string;
  visualization?: string;
}

const THEME_SECTIONS: ThemeSectionConfig[] = [
  {
    id: 'defaultSchemes',
    translationKey: 'theme.defaultSchemes'
  },
  {
    id: 'sankey',
    showDiagramKey: 'sankey',
    translationKey: 'theme.sankeyDiagram',
    visualization: 'sankey'
  },
  {
    id: 'calendar',
    showDiagramKey: 'calendar',
    translationKey: 'theme.calendar',
    visualization: 'calendar'
  },
  {
    id: 'flg',
    showDiagramKey: 'flg',
    translationKey: 'theme.forcedLayoutGraph',
    visualization: 'flg'
  },
  {
    id: 'heb',
    showDiagramKey: 'heb',
    translationKey: 'theme.hierarchicalEdgeBundling',
    visualization: 'heb'
  },
  {
    id: 'wordCloud',
    showDiagramKey: 'wordCloud',
    translationKey: 'theme.wordCloud',
    visualization: 'wordcloud'
  },
  {
    id: 'lineChart',
    showDiagramKey: 'lineChart',
    translationKey: 'theme.lineChart',
    visualization: 'lineChart'
  },
  {
    id: 'barChart',
    showDiagramKey: 'barChart',
    translationKey: 'theme.barChart',
    visualization: 'barChart'
  },
  {
    id: 'pieChart',
    showDiagramKey: 'pieChart',
    translationKey: 'theme.pieChart',
    visualization: 'pieChart'
  },
  {
    id: 'scatter',
    showDiagramKey: 'scatter',
    translationKey: 'theme.scatter',
    visualization: 'scatter'
  },
  {
    id: 'treeMap',
    showDiagramKey: 'treeMap',
    translationKey: 'theme.treeMap',
    visualization: 'treeMap'
  },
  {
    id: 'sunburst',
    showDiagramKey: 'sunburst',
    translationKey: 'theme.sunburst',
    visualization: 'sunburst'
  },
  {
    id: 'funnel',
    showDiagramKey: 'funnel',
    translationKey: 'theme.funnel',
    visualization: 'funnel'
  }
];

const normalizeSearchValue = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

const ThemeShell = () => {
  const { t } = useLocale();
  const colorPalette: { [key: string]: string[] } = siteConfig.colorPallets;
  const activeTheme = useThemeColors();
  const themeDispatch = useThemeColorsDispach();
  const [selectedSchemeName, setSelectedSchemeName] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('');
  const [sectionSearch, setSectionSearch] = useState('');
  const [showDiagram, setShowDiagram] = useState<ShowDiagramState>({
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
  });

  const filteredSections = useMemo(() => {
    const normalizedQuery = normalizeSearchValue(sectionSearch.trim());

    if (!normalizedQuery) {
      return THEME_SECTIONS;
    }

    return THEME_SECTIONS.filter((section) => normalizeSearchValue(t(section.translationKey)).startsWith(normalizedQuery));
  }, [sectionSearch, t]);

  const findMatchingScheme = useMemo(() => {
    const activeColors = activeTheme.sankey.light.colors;
    const foundEntry = Object.entries(colorPalette).find(
      ([, paletteColors]) => JSON.stringify(paletteColors) === JSON.stringify(activeColors)
    );
    return foundEntry?.[0] ?? null;
  }, [activeTheme.sankey.light.colors, colorPalette]);

  useEffect(() => {
    setSelectedSchemeName(findMatchingScheme);
  }, [findMatchingScheme]);

  const handleApplyTheme = (themeName: string) => {
    const appliedThemeColors: UtilTypes.DeepPartial<ThemeColors> = {
      flg: {
        dark: { colors: colorPalette[themeName] },
        light: { colors: colorPalette[themeName] }
      },
      sankey: {
        dark: { colors: colorPalette[themeName] },
        light: { colors: colorPalette[themeName] }
      },
      calendar: {
        dark: { colors: colorPalette[themeName] },
        light: { colors: colorPalette[themeName] }
      },
      wordcloud: {
        dark: { colors: colorPalette[themeName] },
        light: { colors: colorPalette[themeName] }
      },
      heb: {
        dark: { colors: colorPalette[themeName] },
        light: { colors: colorPalette[themeName] }
      },
      lineChart: {
        dark: { colors: colorPalette[themeName] },
        light: { colors: colorPalette[themeName] }
      },
      barChart: {
        dark: { colors: colorPalette[themeName] },
        light: { colors: colorPalette[themeName] }
      },
      scatter: {
        dark: { colors: colorPalette[themeName] },
        light: { colors: colorPalette[themeName] }
      },
      pieChart: {
        dark: { colors: colorPalette[themeName] },
        light: { colors: colorPalette[themeName] }
      },
      treeMap: {
        dark: { colors: colorPalette[themeName] },
        light: { colors: colorPalette[themeName] }
      },
      sunburst: {
        dark: { colors: colorPalette[themeName] },
        light: { colors: colorPalette[themeName] }
      },
      funnel: {
        dark: { colors: colorPalette[themeName] },
        light: { colors: colorPalette[themeName] }
      }
    };

    if (themeDispatch) {
      themeDispatch({
        type: 'apply',
        modifiedData: appliedThemeColors
      });
      setSelectedSchemeName(themeName);
    }
  };

  const handleColorChange = (
    newColor: string,
    index: number,
    visualization: string,
    theme: string
  ) => {
    const updatedTheme = { ...activeTheme };
    // @ts-ignore
    updatedTheme[visualization][theme].colors[index] = newColor;
    if (themeDispatch) {
      setTimeout(() => {
        themeDispatch({
          type: 'apply',
          modifiedData: updatedTheme
        });
        setSelectedSchemeName(null);
      }, 200);
    }
  };

  const handleColorAdd = (visualization: string, theme: string) => {
    const updatedTheme = { ...activeTheme };
    // @ts-ignore
    updatedTheme[visualization][theme].colors.push('#FFFFFF');
    if (themeDispatch) {
      themeDispatch({
        type: 'apply',
        modifiedData: updatedTheme
      });
      setSelectedSchemeName(null);
    }
  };

  const handleColorDelete = (visualization: string, theme: string) => {
    const updatedTheme = { ...activeTheme };
    // @ts-ignore
    updatedTheme[visualization][theme].colors.pop();
    if (themeDispatch) {
      themeDispatch({
        type: 'apply',
        modifiedData: updatedTheme
      });
      setSelectedSchemeName(null);
    }
  };

  const setShowDiagramHandler = (keyToSet?: keyof ShowDiagramState) => {
    setShowDiagram((prev) => {
      const newState = Object.fromEntries(
        Object.keys(prev).map((key) => [key, false])
      );

      if (keyToSet) {
        newState[keyToSet] = true;
      }

      return newState as unknown as ShowDiagramState;
    });
  };

  const handleSectionSelect = (section: ThemeSectionConfig) => {
    setActiveSection((previous) => {
      const next = previous === section.id ? '' : section.id;
      setShowDiagramHandler(next ? section.showDiagramKey : undefined);
      return next;
    });
  };

  return (
    <div className="flex h-screen">
      <ScrollArea className="fixed h-screen w-1/4 overflow-y-auto border-r-4 p-4">
        <div className="mb-3">
          <Input
            value={sectionSearch}
            onChange={(event) => setSectionSearch(event.target.value)}
            placeholder={t('theme.searchTypes')}
            aria-label={t('theme.searchTypes')}
            className="h-9"
          />
        </div>
        <Accordion type="single" collapsible value={activeSection}>
          {filteredSections.map((section) => (
            <AccordionItem key={section.id} value={section.id}>
              <AccordionTrigger
                className="cursor-pointer"
                onClick={() => handleSectionSelect(section)}
              >
                {t(section.translationKey)}
              </AccordionTrigger>
              <AccordionContent>
                {section.visualization ? (
                  <GenericThemesAccordion
                    handleColorChange={handleColorChange}
                    handleColorDelete={handleColorDelete}
                    handleColorAdd={handleColorAdd}
                    visualization={section.visualization}
                  />
                ) : (
                  <DefaultThemesAccordion
                    colorPalette={colorPalette}
                    handleApplyTheme={handleApplyTheme}
                    selectedSchemeName={selectedSchemeName}
                  />
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        {filteredSections.length === 0 && (
          <p className="pt-3 text-sm text-muted-foreground">{t('theme.noMatchingTypes')}</p>
        )}
      </ScrollArea>
      {showDiagram.sankey && (
        <div className="flex-grow p-4">
          <SankeyGraphShellView
            fullScreen={true}
            data={siteConfig.nodeLink}
            legend={true}
            options={false}
            filter={false}
          />
        </div>
      )}
      {showDiagram.calendar && (
        <div className="flex-grow p-4">
          <Suspense fallback={<Fallback />}>
            <CalendarGraphShellView
              data={{ calendar: siteConfig.calendar }}
              legend={true}
              options={false}
              filter={false}
              fullScreen={true}
            />
          </Suspense>
        </div>
      )}
      {showDiagram.flg && (
        <div className="flex-grow p-4">
          <Suspense fallback={<Fallback />}>
            <ForcedLayoutGraphShellView
              data={siteConfig.nodeLink}
              legend={true}
              options={false}
              filter={false}
              fullScreen={true}
            />
          </Suspense>
        </div>
      )}
      {showDiagram.wordCloud && (
        <div className="flex-grow p-4">
          <Suspense fallback={<Fallback />}>
            <WordCloudShellView
              data={{ words: siteConfig.words }}
              legend={true}
              options={false}
              filter={false}
              fullScreen={true}
            />
          </Suspense>
        </div>
      )}
      {showDiagram.heb && (
        <div className="flex-grow p-4">
          <Suspense fallback={<Fallback />}>
            <HierarchicalEdgeBundlingShellView
              data={siteConfig.nodeLink}
              legend={true}
              options={false}
              filter={false}
              fullScreen={true}
            />
          </Suspense>
        </div>
      )}
      {showDiagram.lineChart && (
        <div className="flex-grow p-4">
          <Suspense fallback={<Fallback />}>
            <AxisChartsShellView
              data={siteConfig.axisChart}
              legend={true}
              options={false}
              type={'line'}
              filter={false}
              fullScreen={true}
            />
          </Suspense>
        </div>
      )}
      {showDiagram.barChart && (
        <div className="flex-grow p-4">
          <Suspense fallback={<Fallback />}>
            <AxisChartsShellView
              data={siteConfig.axisChart}
              legend={true}
              options={false}
              type={'bar'}
              filter={false}
              fullScreen={true}
            />
          </Suspense>
        </div>
      )}
      {showDiagram.pieChart && (
        <div className="flex-grow p-4">
          <Suspense fallback={<Fallback />}>
            <PieChartShellView
              data={siteConfig.pieChart}
              legend={true}
              options={false}
              filter={false}
              fullScreen={true}
            />
          </Suspense>
        </div>
      )}
      {showDiagram.funnel && (
        <div className="flex-grow p-4">
          <Suspense fallback={<Fallback />}>
            <FunnelShellView
              data={siteConfig.funnel}
              legend={true}
              options={false}
              filter={false}
              fullScreen={true}
            />
          </Suspense>
        </div>
      )}
      {showDiagram.scatter && (
        <div className="flex-grow p-4">
          <Suspense fallback={<Fallback />}>
            <ScatterShellView
              data={siteConfig.scatter as VisualizationTypes.ScatterData}
              legend={true}
              options={false}
              filter={false}
              fullScreen={true}
            />
          </Suspense>
        </div>
      )}
      {showDiagram.treeMap && (
        <div className="flex-grow p-4">
          <Suspense fallback={<Fallback />}>
            <TreeMapShellView
              data={siteConfig.hierarchy as VisualizationTypes.HierarchyData}
              legend={true}
              options={false}
              filter={false}
              fullScreen={true}
            />
          </Suspense>
        </div>
      )}
      {showDiagram.sunburst && (
        <div className="flex-grow p-4">
          <Suspense fallback={<Fallback />}>
            <SunBurstShellView
              data={siteConfig.hierarchy as VisualizationTypes.HierarchyData}
              legend={true}
              options={false}
              filter={false}
              fullScreen={true}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
};

export type { ShowDiagramState };
export default ThemeShell;
