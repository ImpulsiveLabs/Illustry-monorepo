import { VisualizationTypes } from '@illustry/types';

const computeValues = (
  data: VisualizationTypes.PieChartData | VisualizationTypes.FunnelData,
  colors: string[]
) => {
  const { values } = data;
  const keys = Object.keys(values);
  return keys
    .map((key, index) => {
      if (values[key] !== undefined && key !== '' && key && colors[index]) {
        return {
          value: values[key],
          name: key,
          itemStyle: { color: colors[index] }
        };
      }
      return undefined;
    })
    .filter(Boolean);
};

const computeLegendColors = (
  data: VisualizationTypes.PieChartData | VisualizationTypes.FunnelData,
  colors: string[]
) => {
  const keys = Object.keys(data.values);
  const legendColorObject: { [key: string]: string } = {};

  keys.forEach((key, index) => {
    if (key !== undefined && key !== '' && colors[index]) {
      legendColorObject[key] = colors[index] as string;
    }
  });

  return legendColorObject;
};

export { computeValues, computeLegendColors };
