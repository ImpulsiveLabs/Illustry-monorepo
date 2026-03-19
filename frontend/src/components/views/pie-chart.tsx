'use client';

import { getStoredTheme } from '@/lib/theme-mode';
import { VisualizationTypes } from '@illustry/types';
import {
  computeValues
} from '@/lib/visualizations/pieFunnel/helper';
import {
  buildLegendOption
} from '@/lib/visualizations/legend/helper';
import { WithFullScreen, WithLegend, WithOptions } from '@/lib/types/utils';
import { useLocale } from '@/components/providers/locale-provider';
import { useThemeColors } from '../providers/theme-provider';
import ReactEcharts from './generic/echarts';

type PieProp = {
  data: VisualizationTypes.PieChartData;
} & WithLegend
  & WithOptions
  & WithFullScreen

const PieView = ({ data, legend, fullScreen }: PieProp) => {
  const activeTheme = useThemeColors();
  const { t } = useLocale();
  const isDarkTheme = getStoredTheme() === 'dark';
  const colors = isDarkTheme
    ? activeTheme.pieChart.dark.colors
    : activeTheme.pieChart.light.colors;
  const legendItems = Object.keys(data.values || {});
  const centerY = legend ? '60%' : '50%';

  const option = {
    legend: buildLegendOption(legend, legendItems),
    tooltip: {
      trigger: 'item'
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', centerY],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 40,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: true
        },
        data: computeValues(data, colors)
      }
    ]
  };
  const height = fullScreen ? '73.5vh' : '100%';
  return (
    <div className="relative mt-[4%] flex flex-col items-center">
      <div className="w-full h-full">
        <ReactEcharts
          option={option}
          helperText={t('tooltip.pie')}
          className="w-full sm:h-120 lg:h-160"
          style={{
            height
          }}
        />
      </div>
    </div>
  );
};
export default PieView;
