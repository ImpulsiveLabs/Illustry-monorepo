'use client';

import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  Suspense,
  useState
} from 'react';
import {
  VisualizationTypes,
  ValidatorSchemas
} from '@illustry/types';
import siteConfig from '@/config/site';
import { catchError } from '@/lib/utils';
import { Button } from '../ui/button';
import PresetSelector from '../ui/playground/preset-selector';
import Textarea from '../ui/textarea';
import Separator from '../ui/separator';
import Fallback from '../ui/fallback';
import { ShowDiagramState } from './theme-shell';
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
import TimelineShellView from './timeline/timeline-shell';
import MatrixShellView from './matrix/matrix-shell';
import HierarchicalEdgeBundlingShellView from './hierarchical-edge-bundling/hierarchical-edge-bundling-shell';

const PlaygroundShell = () => {
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
  const [textareaValue, setTextareaValue] = useState<string>();
  const [isSubmitable, setIsSubmitable] = useState<boolean>(false);
 const handleTextareaChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
  setTextareaValue(event.target.value);
  setIsSubmitable(false);
};
  const getActiveDiagramKey = (): keyof ShowDiagramState | null => {
    const activeKeys = Object.keys(showDiagram).filter(
      (key) => showDiagram[key as keyof ShowDiagramState]
    );

    return activeKeys.length === 1
      ? (activeKeys[0] as keyof ShowDiagramState)
      : null;
  };

  const toShowDiagram = (name: string, data: Record<string, unknown>) => {
    switch (name) {
      case 'heb':
      case 'flg':
      case 'sankey':
      case 'matrix':
        ValidatorSchemas.validateWithSchema<Record<string, unknown>>(ValidatorSchemas.nodeLinkDataSchema, data);
        break;
      case 'calendar':
        ValidatorSchemas.validateWithSchema<Record<string, unknown>>(ValidatorSchemas.calendarDataSchema, data);
        break;
      case 'wordCloud':
        ValidatorSchemas.validateWithSchema<Record<string, unknown>>(ValidatorSchemas.wordCloudDataSchema, data);
        break;
      case 'lineChart':
      case 'barChart':
        ValidatorSchemas.validateWithSchema<Record<string, unknown>>(ValidatorSchemas.axisChartDataSchema, data);
        break;
      case 'pieChart':
      case 'funnel':
        ValidatorSchemas.validateWithSchema<Record<string, unknown>>(ValidatorSchemas.pieChartFunnelDataSchema, data);
        break;
      case 'scatter':
        ValidatorSchemas.validateWithSchema<Record<string, unknown>>(ValidatorSchemas.scatterDataSchema, data);
        break;
      case 'treemap':
      case 'sunburst':
        ValidatorSchemas.validateWithSchema<Record<string, unknown>>(ValidatorSchemas.hierarchySchema, data);
        break;
      case 'timeline':
        ValidatorSchemas.validateWithSchema<Record<string, unknown>>(ValidatorSchemas.timelineDataSchema, data);
        break;
      default:
        break;
    }
  };
  const handleSubmit = () => {
    try {
      const data = JSON.parse(textareaValue as string);
      setIsSubmitable(true);
      const activeKey = getActiveDiagramKey();
      toShowDiagram(activeKey as string, data);
    } catch (error) {
      setIsSubmitable(false);
      catchError(error);
    }
  };
  const createVisualizations = () => (
    <div className="overflow-auto flex-grow bg-gray-50 rounded-3xl dark:bg-gray-800 p-4 m-4 visualization-div">
      {Object.keys(showDiagram).map(
        (key) => showDiagram[key as keyof ShowDiagramState] && (
          <div key={key} className="w-full h-full">
            <Suspense fallback={<Fallback />}>
              {key === 'barChart' && isSubmitable && (
                <AxisChartsShellView
                  data={JSON.parse(textareaValue as string) as VisualizationTypes.AxisChartData}
                  legend={false}
                  options={false}
                  type={'bar'}
                  filter={false}
                />
              )}
              {key === 'lineChart' && isSubmitable && (
                <AxisChartsShellView
                  data={JSON.parse(textareaValue as string) as VisualizationTypes.AxisChartData}
                  legend={false}
                  options={false}
                  type={'line'}
                  filter={false}
                />
              )}
              {key === 'sankey' && isSubmitable && (
                <SankeyGraphShellView
                  data={JSON.parse(textareaValue as string) as VisualizationTypes.NodeLinkData}
                  legend={false}
                  options={false}
                  filter={false}
                />
              )}
              {key === 'heb' && isSubmitable && (
                <HierarchicalEdgeBundlingShellView
                  data={siteConfig.nodeLink}
                  legend={false}
                  options={false}
                  filter={false}
                  containered={true}
                />
              )}
              {key === 'flg' && isSubmitable && (
                <ForcedLayoutGraphShellView
                  data={JSON.parse(textareaValue as string) as VisualizationTypes.NodeLinkData}
                  legend={false}
                  options={false}
                  filter={false}
                />
              )}
              {key === 'matrix' && isSubmitable && (
                <MatrixShellView
                  data={JSON.parse(textareaValue as string) as VisualizationTypes.NodeLinkData}
                  legend={false}
                  options={false}
                  filter={false}
                />
              )}
              {key === 'wordCloud' && isSubmitable && (
                <WordCloudShellView
                  data={JSON.parse(textareaValue as string) as VisualizationTypes.WordCloudData}
                  legend={false}
                  options={false}
                  filter={false}
                />
              )}
              {key === 'funnel' && isSubmitable && (
                <FunnelShellView
                  data={JSON.parse(textareaValue as string) as VisualizationTypes.FunnelData}
                  legend={false}
                  options={false}
                  filter={false}
                />
              )}
              {key === 'pieChart' && isSubmitable && (
                <PieChartShellView
                  data={JSON.parse(textareaValue as string) as VisualizationTypes.FunnelData}
                  legend={false}
                  options={false}
                  filter={false}
                />
              )}
              {key === 'scatter' && isSubmitable && (
                <ScatterShellView
                  data={JSON.parse(textareaValue as string) as VisualizationTypes.ScatterData}
                  legend={false}
                  options={false}
                  filter={false}
                />
              )}
              {key === 'sunburst' && isSubmitable && (
                <SunBurstShellView
                  data={JSON.parse(textareaValue as string) as VisualizationTypes.HierarchyData}
                  legend={false}
                  options={false}
                  filter={false}
                />
              )}
              {key === 'timeline' && isSubmitable && (
                <TimelineShellView
                  data={JSON.parse(textareaValue as string) as VisualizationTypes.TimelineData}
                  legend={false}
                  options={false}
                  filter={false}

                />
              )}
              {key === 'treeMap' && isSubmitable && (
                <TreeMapShellView
                  data={JSON.parse(textareaValue as string) as VisualizationTypes.HierarchyData}
                  legend={false}
                  options={false}
                  filter={false}
                />
              )}
              {key === 'calendar' && isSubmitable && (
                <CalendarGraphShellView
                  data={JSON.parse(textareaValue as string) as VisualizationTypes.CalendarData}
                  legend={false}
                  options={false}
                  filter={false}
                />
              )}
            </Suspense>
          </div>
        )
      )}
    </div>
  );

  return (
    <>
      <div className="hidden flex-col md:flex">
        <div className="container flex flex-col items-start justify-between
         space-y-2 py-4 sm:flex-row sm:items-center sm:space-y-0 md:h-16">
          <h2 className="text-lg font-semibold">Playground</h2>
          <div className="ml-auto flex w-full space-x-2 sm:justify-end">
            <PresetSelector
              presets={siteConfig.visualizations}
              setShowDiagram={setShowDiagram}
              setTextareaValue={
                setTextareaValue as Dispatch<SetStateAction<string>>
              }
              setIsSubmitable={setIsSubmitable}
            />
            <div className="hidden space-x-2 md:flex">
              {/* <CodeViewer /> */}
            </div>
          </div>
        </div>
        <Separator />
        <div className="flex h-screen">
          <div className="w-[50%] md:w-1/3 p-4">
            <div className="container h-[93%] py-6 bg-gray-50 rounded-3xl dark:bg-gray-800">
              <Textarea
                value={textareaValue}
                onChange={handleTextareaChange}
                className="w-full h-[90%] flex-1 p-4 border-gray-300 bg-gray-50 rounded-3xl
                 dark:border-gray-700 dark:bg-gray-800 md:min-h-[530px] lg:min-h-[530px]"
                style={{ overflow: 'scroll', resize: 'none' }}
              />
              <div className="flex items-center space-x-2 mt-4">
                <Button onClick={handleSubmit}>Submit</Button>
              </div>
            </div>
          </div>

          <div className="w-full h-[80%] md:w-2/3">
            {createVisualizations()}
          </div>
        </div>
      </div>
    </>
  );
};

export default PlaygroundShell;
