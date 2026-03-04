/* eslint-disable @typescript-eslint/ban-ts-comment */

'use client';

import {
  RefObject,
  Suspense, useEffect, useRef, useState
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
  const [activeColorPickerIndex, setActiveColorPickerIndex] = useState<
    number | null
  >(null);
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
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const handleOutsideClick = (event: MouseEvent) => {
    if (
      colorPickerRef.current
      && !colorPickerRef.current.contains(((event as MouseEvent).target as Node))
    ) {
      setActiveColorPickerIndex(null);
    }
  };
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
  useEffect(() => {
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

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
                activeColorPickerIndex={activeColorPickerIndex}
                handleColorChange={handleColorChange}
                handleColorDelete={handleColorDelete}
                handleColorAdd={handleColorAdd}
                setActiveColorPickerIndex={setActiveColorPickerIndex}
                visualization="sankey"
                colorPickerRef={colorPickerRef as RefObject<HTMLDivElement> }
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
                activeColorPickerIndex={activeColorPickerIndex}
                handleColorChange={handleColorChange}
                handleColorDelete={handleColorDelete}
                handleColorAdd={handleColorAdd}
                setActiveColorPickerIndex={setActiveColorPickerIndex}
                visualization="calendar"
                colorPickerRef={colorPickerRef as RefObject<HTMLDivElement> }
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
                activeColorPickerIndex={activeColorPickerIndex}
                handleColorChange={handleColorChange}
                handleColorDelete={handleColorDelete}
                handleColorAdd={handleColorAdd}
                setActiveColorPickerIndex={setActiveColorPickerIndex}
                visualization="flg"
                colorPickerRef={colorPickerRef as RefObject<HTMLDivElement> }
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
                activeColorPickerIndex={activeColorPickerIndex}
                handleColorChange={handleColorChange}
                handleColorDelete={handleColorDelete}
                handleColorAdd={handleColorAdd}
                setActiveColorPickerIndex={setActiveColorPickerIndex}
                visualization="heb"
                colorPickerRef={colorPickerRef as RefObject<HTMLDivElement> }
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
                activeColorPickerIndex={activeColorPickerIndex}
                handleColorChange={handleColorChange}
                handleColorDelete={handleColorDelete}
                handleColorAdd={handleColorAdd}
                setActiveColorPickerIndex={setActiveColorPickerIndex}
                visualization="wordcloud"
                colorPickerRef={colorPickerRef as RefObject<HTMLDivElement> }
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
                activeColorPickerIndex={activeColorPickerIndex}
                handleColorChange={handleColorChange}
                handleColorDelete={handleColorDelete}
                handleColorAdd={handleColorAdd}
                setActiveColorPickerIndex={setActiveColorPickerIndex}
                visualization="lineChart"
                colorPickerRef={colorPickerRef as RefObject<HTMLDivElement> }
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
                activeColorPickerIndex={activeColorPickerIndex}
                handleColorChange={handleColorChange}
                handleColorDelete={handleColorDelete}
                handleColorAdd={handleColorAdd}
                setActiveColorPickerIndex={setActiveColorPickerIndex}
                visualization="barChart"
                colorPickerRef={colorPickerRef as RefObject<HTMLDivElement> }
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
                activeColorPickerIndex={activeColorPickerIndex}
                handleColorChange={handleColorChange}
                handleColorDelete={handleColorDelete}
                handleColorAdd={handleColorAdd}
                setActiveColorPickerIndex={setActiveColorPickerIndex}
                visualization="pieChart"
                colorPickerRef={colorPickerRef as RefObject<HTMLDivElement> }
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
                activeColorPickerIndex={activeColorPickerIndex}
                handleColorChange={handleColorChange}
                handleColorDelete={handleColorDelete}
                handleColorAdd={handleColorAdd}
                setActiveColorPickerIndex={setActiveColorPickerIndex}
                visualization="scatter"
                colorPickerRef={colorPickerRef as RefObject<HTMLDivElement> }
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
                activeColorPickerIndex={activeColorPickerIndex}
                handleColorChange={handleColorChange}
                handleColorDelete={handleColorDelete}
                handleColorAdd={handleColorAdd}
                setActiveColorPickerIndex={setActiveColorPickerIndex}
                visualization="treeMap"
                colorPickerRef={colorPickerRef as RefObject<HTMLDivElement> }
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
                activeColorPickerIndex={activeColorPickerIndex}
                handleColorChange={handleColorChange}
                handleColorDelete={handleColorDelete}
                handleColorAdd={handleColorAdd}
                setActiveColorPickerIndex={setActiveColorPickerIndex}
                visualization="sunburst"
                colorPickerRef={colorPickerRef as RefObject<HTMLDivElement> }
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
                activeColorPickerIndex={activeColorPickerIndex}
                handleColorChange={handleColorChange}
                handleColorDelete={handleColorDelete}
                handleColorAdd={handleColorAdd}
                setActiveColorPickerIndex={setActiveColorPickerIndex}
                visualization="funnel"
                colorPickerRef={colorPickerRef as RefObject<HTMLDivElement> }
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
