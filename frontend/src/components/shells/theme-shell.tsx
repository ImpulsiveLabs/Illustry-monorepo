/* eslint-disable @typescript-eslint/ban-ts-comment */

'use client';

import {
  Suspense, useEffect, useMemo, useState
} from 'react';
import { VisualizationTypes, UtilTypes } from '@illustry/types';
import siteConfig from '@/config/site';
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

const ThemeShell = () => {
  const colorPalette: { [key: string]: string[] } = siteConfig.colorPallets;
  const activeTheme = useThemeColors();
  const themeDispatch = useThemeColorsDispach();
  const [selectedSchemeName, setSelectedSchemeName] = useState<string | null>(null);
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
      // Create a new object with all keys set to false
      const newState = Object.fromEntries(
        Object.keys(prev).map((key) => [key, false])
      );
      if (keyToSet) {
        // Set the specified key to true
        newState[keyToSet] = true;
      }
      return newState as unknown as ShowDiagramState;
    });
  };
  return (
    <div className="flex h-screen">
      <ScrollArea className="fixed w-1/4 p-4 overflow-y-auto h-screen border-r-4">
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1" onClick={() => setShowDiagramHandler()}>
            <AccordionTrigger className="cursor-pointer">
              Default Schemes
            </AccordionTrigger>
            <AccordionContent>
              <DefaultThemesAccordion
                colorPalette={colorPalette}
                handleApplyTheme={handleApplyTheme}
                selectedSchemeName={selectedSchemeName}
              />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem
            value="item-2"
            onClick={() => setShowDiagramHandler('sankey')}
          >
            <AccordionTrigger className="cursor-pointer">
              Sankey Diagram
            </AccordionTrigger>
            <AccordionContent>
              <GenericThemesAccordion
                handleColorChange={handleColorChange}
                handleColorDelete={handleColorDelete}
                handleColorAdd={handleColorAdd}
                visualization="sankey"
              />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem
            value="item-3"
            onClick={() => setShowDiagramHandler('calendar')}
          >
            <AccordionTrigger className="cursor-pointer">
              Calendar
            </AccordionTrigger>
            <AccordionContent>
              <GenericThemesAccordion
                handleColorChange={handleColorChange}
                handleColorDelete={handleColorDelete}
                handleColorAdd={handleColorAdd}
                visualization="calendar"
              />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem
            value="item-4"
            onClick={() => setShowDiagramHandler('flg')}
          >
            <AccordionTrigger className="cursor-pointer">
              Forced-Layout-Graph
            </AccordionTrigger>
            <AccordionContent>
              <GenericThemesAccordion
                handleColorChange={handleColorChange}
                handleColorDelete={handleColorDelete}
                handleColorAdd={handleColorAdd}
                visualization="flg"
              />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-5">
            <AccordionTrigger
              className="cursor-pointer"
              onClick={() => setShowDiagramHandler('heb')}
            >
              Hierarchical-Edge-Bundling
            </AccordionTrigger>
            <AccordionContent>
              <GenericThemesAccordion
                handleColorChange={handleColorChange}
                handleColorDelete={handleColorDelete}
                handleColorAdd={handleColorAdd}
                visualization="heb"
              />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-6">
            <AccordionTrigger
              className="cursor-pointer"
              onClick={() => setShowDiagramHandler('wordCloud')}
            >
              Word-Cloud
            </AccordionTrigger>
            <AccordionContent>
              <GenericThemesAccordion
                handleColorChange={handleColorChange}
                handleColorDelete={handleColorDelete}
                handleColorAdd={handleColorAdd}
                visualization="wordcloud"
              />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-7">
            <AccordionTrigger
              className="cursor-pointer"
              onClick={() => setShowDiagramHandler('lineChart')}
            >
              Line-Chart
            </AccordionTrigger>
            <AccordionContent>
              <GenericThemesAccordion
                handleColorChange={handleColorChange}
                handleColorDelete={handleColorDelete}
                handleColorAdd={handleColorAdd}
                visualization="lineChart"
              />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-8">
            <AccordionTrigger
              className="cursor-pointer"
              onClick={() => setShowDiagramHandler('barChart')}
            >
              Bar-Chart
            </AccordionTrigger>
            <AccordionContent>
              <GenericThemesAccordion
                handleColorChange={handleColorChange}
                handleColorDelete={handleColorDelete}
                handleColorAdd={handleColorAdd}
                visualization="barChart"
              />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-9">
            <AccordionTrigger
              className="cursor-pointer"
              onClick={() => setShowDiagramHandler('pieChart')}
            >
              Pie-Chart
            </AccordionTrigger>
            <AccordionContent>
              <GenericThemesAccordion
                handleColorChange={handleColorChange}
                handleColorDelete={handleColorDelete}
                handleColorAdd={handleColorAdd}
                visualization="pieChart"
              />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-10">
            <AccordionTrigger
              className="cursor-pointer"
              onClick={() => setShowDiagramHandler('scatter')}
            >
              Scatter
            </AccordionTrigger>
            <AccordionContent>
              <GenericThemesAccordion
                handleColorChange={handleColorChange}
                handleColorDelete={handleColorDelete}
                handleColorAdd={handleColorAdd}
                visualization="scatter"
              />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-11">
            <AccordionTrigger
              className="cursor-pointer"
              onClick={() => setShowDiagramHandler('treeMap')}
            >
              TreeMap
            </AccordionTrigger>
            <AccordionContent>
              <GenericThemesAccordion
                handleColorChange={handleColorChange}
                handleColorDelete={handleColorDelete}
                handleColorAdd={handleColorAdd}
                visualization="treeMap"
              />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-12">
            <AccordionTrigger
              className="cursor-pointer"
              onClick={() => setShowDiagramHandler('sunburst')}
            >
              Sunburst
            </AccordionTrigger>
            <AccordionContent>
              <GenericThemesAccordion
                handleColorChange={handleColorChange}
                handleColorDelete={handleColorDelete}
                handleColorAdd={handleColorAdd}
                visualization="sunburst"
              />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-13">
            <AccordionTrigger
              className="cursor-pointer"
              onClick={() => setShowDiagramHandler('funnel')}
            >
              Funnel
            </AccordionTrigger>
            <AccordionContent>
              <GenericThemesAccordion
                handleColorChange={handleColorChange}
                handleColorDelete={handleColorDelete}
                handleColorAdd={handleColorAdd}
                visualization="funnel"
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </ScrollArea>
      {showDiagram.sankey && (
        <div className="flex-grow p-4">
          <SankeyGraphShellView
            fullScreen={true}
            data={siteConfig.nodeLink}
            legend={false}
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
              legend={false}
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
              legend={false}
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
              legend={false}
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
              legend={false}
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
              legend={false}
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
              legend={false}
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
              legend={false}
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
              legend={false}
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
              legend={false}
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
              legend={false}
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
              legend={false}
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
