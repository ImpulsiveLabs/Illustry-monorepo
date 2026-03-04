import { VisualizationTypes } from '@illustry/types';

const computePropertiesForToolTip = (
  properties: string | Record<string, string | number>,
  value?: number | string
) => {
  let prop = '';

  if (typeof properties === 'object' && properties !== null) {
    Object.entries(properties).forEach(([key]) => {
      if (Object.hasOwnProperty.call(properties, key)) {
        const propValue = properties[key];
        prop += `<div style="font-weight: bold">${key}:${propValue}</div>`;
      }
    });

    if (value) {
      prop += `<div style="font-weight: bold">value:${value}</div>`;
    }
  } else if (typeof properties === 'string') {
    if (value) {
      prop
        += `${properties}<div style="font-weight: bold">value:${value}</div>`;
    } else {
      prop += properties;
    }
  } else if (value) {
    prop += `<div style="font-weight: bold">value:${value}</div>`;
  }

  return prop;
};

const calculateMeanValue = (numbers: number[]) => {
  if (numbers.length === 0) {
    return 0;
  }

  const sum = numbers.reduce((total, num) => total + num, 0);
  const mean = sum / numbers.length;

  return mean;
};

const computeColor = (nr: number, meanValue: number, colors: string[]) => {
  if (meanValue === 0) {
    return '';
  }
  const percent = (nr * 100) / meanValue;
  if (percent > 0 && percent <= 25) {
    return colors[0] || '';
  }
  if (percent > 25 && percent <= 50) {
    return colors[1] || '';
  }
  if (percent > 50 && percent <= 75) {
    return colors[2] || '';
  }
  if (percent > 75 && percent <= 100) {
    return colors[3] || '';
  }
  if (percent > 100) {
    return colors[4] || '';
  }
  return '';
};

const computeWords = (words: VisualizationTypes.WordType[], colors: string[]) => {
  const values = words.map((word) => word.value).filter((value) => value > 0);
  const meanValue = calculateMeanValue(values);

  return words.map((word) => ({
    ...word,
    textStyle: {
      fontWeight: 'bold',
      color: computeColor(word.value, meanValue, colors)
    }
  }));
};

export {
  computePropertiesForToolTip,
  computeWords,
  calculateMeanValue,
  computeColor
};
