type LegendOption = {
  show: boolean;
  type: 'scroll';
  orient: 'horizontal';
  icon: 'roundRect';
  itemWidth: number;
  itemHeight: number;
  top: number;
  left: 'center';
  right: number;
  itemGap: number;
  pageIconColor: string;
  pageTextStyle: {
    fontSize: number;
  };
  tooltip: {
    show: boolean;
  };
  textStyle: {
    fontSize: number;
    width: number;
    overflow: 'truncate';
    ellipsis: string;
  };
  formatter: (name: string) => string;
  data: string[];
};

type LegendProxySeries = {
  id: string;
  type: 'pie';
  radius: [number, number];
  center: [string, string];
  silent: boolean;
  tooltip: {
    show: boolean;
  };
  label: {
    show: boolean;
  };
  labelLine: {
    show: boolean;
  };
  itemStyle: {
    opacity: number;
  };
  data: Array<{
    name: string;
    value: number;
    itemStyle?: {
      color?: string;
    };
  }>;
};

const getLegendItems = (items: string[]) => {
  const normalized = items.map((item, index) => {
    const label = (typeof item === 'string' ? item : String(item || '')).trim();
    return label.length > 0 ? label : `Series ${index + 1}`;
  });

  const unique = Array.from(new Set(normalized));
  return unique.length > 0 ? unique : ['Series 1'];
};

const buildLegendSelectedMap = (items: string[]) => {
  const legendItems = getLegendItems(items);
  return legendItems.reduce<Record<string, boolean>>((accumulator, item) => {
    accumulator[item] = true;
    return accumulator;
  }, {});
};

const buildLegendProxySeries = (
  items: string[],
  colorMap?: Record<string, string>
): LegendProxySeries => ({
  id: 'legend-proxy',
  type: 'pie',
  radius: [0, 0],
  center: ['-200%', '-200%'],
  silent: true,
  tooltip: {
    show: false
  },
  label: {
    show: false
  },
  labelLine: {
    show: false
  },
  itemStyle: {
    opacity: 0
  },
  data: getLegendItems(items).map((name) => ({
    name,
    value: 1,
    itemStyle: {
      color: colorMap?.[name]
    }
  }))
});

const getLegendFontSize = (items: string[]) => {
  const maxLength = items.reduce((max, item) => Math.max(max, (item || '').length), 0);

  if (maxLength > 24) {
    return 9;
  }
  if (maxLength > 16) {
    return 10;
  }

  return 11;
};

const getLegendTextWidth = (items: string[]) => {
  const maxLength = items.reduce((max, item) => Math.max(max, (item || '').length), 0);

  if (maxLength > 32) {
    return 88;
  }
  if (maxLength > 20) {
    return 100;
  }

  return 120;
};

const truncateLegendName = (name: string) => {
  const normalized = (name || '').trim();
  if (normalized.length <= 24) {
    return normalized;
  }

  return `${normalized.slice(0, 21)}...`;
};

const buildLegendOption = (
  show: boolean,
  items: string[],
  top = 0
): LegendOption => {
  const normalizedItems = getLegendItems(items);

  return {
    show,
    type: 'scroll',
    orient: 'horizontal',
    icon: 'roundRect',
    itemWidth: 12,
    itemHeight: 10,
    top,
    left: 'center',
    right: 12,
    itemGap: 10,
    pageIconColor: '#888',
    pageTextStyle: {
      fontSize: 10
    },
    tooltip: {
      show: true
    },
    textStyle: {
      fontSize: getLegendFontSize(normalizedItems),
      width: getLegendTextWidth(normalizedItems),
      overflow: 'truncate',
      ellipsis: '...'
    },
    formatter: truncateLegendName,
    data: normalizedItems
  };
};

const getChartTopPadding = (showLegend: boolean, hasTitle = false) => {
  const titlePadding = hasTitle ? 40 : 0;
  const legendPadding = showLegend ? 68 : 10;

  return titlePadding + legendPadding;
};

export {
  buildLegendOption,
  getChartTopPadding,
  getLegendItems,
  buildLegendSelectedMap,
  buildLegendProxySeries
};
