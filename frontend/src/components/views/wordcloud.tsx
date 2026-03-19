'use client';

import { useEffect, useMemo, useState } from 'react';
import { getStoredTheme } from '@/lib/theme-mode';
import { VisualizationTypes } from '@illustry/types';
import {
  calculateMeanValue,
  computeWords,
  computePropertiesForToolTip
} from '@/lib/visualizations/word-cloud/helper';
import {
  buildLegendProxySeries,
  buildLegendOption,
  buildLegendSelectedMap,
  getChartTopPadding
} from '@/lib/visualizations/legend/helper';
import { WithFullScreen, WithLegend, WithOptions } from '@/lib/types/utils';
import { useLocale } from '@/components/providers/locale-provider';
import { useThemeColors } from '../providers/theme-provider';
import ReactEcharts from './generic/echarts';

type WordCloudProp = {
  words: VisualizationTypes.WordType[];
} & WithLegend
  & WithOptions
  & WithFullScreen

const WordCloudView = ({ words, legend, fullScreen }: WordCloudProp) => {
  const activeTheme = useThemeColors();
  const { t } = useLocale();
  const isDarkTheme = getStoredTheme() === 'dark';
  const colors = isDarkTheme
    ? activeTheme.wordcloud.dark.colors
    : activeTheme.wordcloud.light.colors;
  const chartTop = getChartTopPadding(legend);
  const visibleWords = useMemo(
    () => [...words].sort((left, right) => right.value - left.value).slice(0, 10),
    [words]
  );
  const meanValue = useMemo(
    () => calculateMeanValue(visibleWords.map((word) => word.value).filter((value) => value > 0)),
    [visibleWords]
  );
  const getIntervalLabel = (value: number) => {
    if (meanValue <= 0 || value <= 0) {
      return 'No value';
    }

    const percent = (value * 100) / meanValue;
    if (percent <= 25) return '0-25% avg';
    if (percent <= 50) return '25-50% avg';
    if (percent <= 75) return '50-75% avg';
    if (percent <= 100) return '75-100% avg';
    return '>100% avg';
  };
  const baseLegendItems = useMemo(
    () => ['0-25% avg', '25-50% avg', '50-75% avg', '75-100% avg', '>100% avg'],
    []
  );
  const hasNoValueBucket = useMemo(
    () => visibleWords.some((word) => getIntervalLabel(word.value) === 'No value'),
    [visibleWords, meanValue]
  );
  const legendItems = useMemo(
    () => (hasNoValueBucket ? [...baseLegendItems, 'No value'] : baseLegendItems),
    [hasNoValueBucket, baseLegendItems]
  );
  const legendColorMap = useMemo(() => ({
    '0-25% avg': colors[0] || '#888',
    '25-50% avg': colors[1] || '#888',
    '50-75% avg': colors[2] || '#888',
    '75-100% avg': colors[3] || '#888',
    '>100% avg': colors[4] || '#888',
    'No value': '#999'
  }), [colors]);
  const [selectedLegendItems, setSelectedLegendItems] = useState<Record<string, boolean>>(
    () => buildLegendSelectedMap(legendItems)
  );

  useEffect(() => {
    setSelectedLegendItems(buildLegendSelectedMap(legendItems));
  }, [legendItems]);

  const filteredWords = useMemo(
    () => visibleWords.filter((word) => selectedLegendItems[getIntervalLabel(word.value)] !== false),
    [visibleWords, selectedLegendItems, meanValue]
  );
  const onEvents = {
    legendselectchanged: (params: { selected?: Record<string, boolean> }) => {
      setSelectedLegendItems(params.selected || buildLegendSelectedMap(legendItems));
    }
  };

  const option = {
    legend: {
      ...buildLegendOption(legend, legendItems),
      selected: selectedLegendItems
    },
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove',
      formatter(params: {
        data: {
          properties: string | Record<string, string | number>;
          value: string | number | undefined;
        };
      }) {
        return computePropertiesForToolTip(
          params.data.properties,
          params.data.value
        );
      }
    },

    series: [
      {
        type: 'wordCloud',
        name: 'Words',
        shape: 'circle',
        data: computeWords(filteredWords, colors),
        keepAspect: true,
        left: 'center',
        top: chartTop,
        width: '70%',
        height: legend ? '70%' : '80%',
        right: null,
        bottom: null,
        sizeRange: [12, 60],
        rotationRange: [-90, 90],
        rotationStep: 45,
        gridSize: 10,
        emphasis: {
          focus: 'self',

          textStyle: {
            textShadowBlur: 10,
            textShadowColor: '#333'
          }
        }
      },
      buildLegendProxySeries(legendItems, legendColorMap)
    ]
  };
  const height = fullScreen ? '73.5vh' : '100%';
  return (
    <div className="w-full h-full">
      <ReactEcharts
        option={option}
        onEvents={onEvents}
        helperText={t('tooltip.wordcloud')}
        className="w-full sm:h-120 lg:h-160"
        style={{
          height
        }}
      />
    </div>
  );
};
export default WordCloudView;
