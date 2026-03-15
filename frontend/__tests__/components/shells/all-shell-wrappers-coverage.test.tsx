import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/dynamic', () => ({
  default: (loader: () => Promise<unknown>) => {
    try {
      const pending = loader();
      if (pending && typeof (pending as Promise<unknown>).catch === 'function') {
        (pending as Promise<unknown>).catch(() => {});
      }
    } catch {
      // no-op
    }
    return (props: Record<string, unknown>) => (
      <div data-testid="dynamic-view">{Object.keys(props).length}</div>
    );
  }
}));

vi.mock('@/components/ui/collapsable-searchbar', () => ({
  default: ({ data, setFilteredData }: any) => (
    <button data-testid="apply-search" onClick={() => setFilteredData(data)}>
      apply-search
    </button>
  )
}));

import AxisShell from '@/components/shells/axis/axis-shell';
import FilterAxisShell from '@/components/shells/axis/filter-axis-shell';
import CalendarShell from '@/components/shells/calendar/calendar-shell';
import FilterCalendarShell from '@/components/shells/calendar/filter-calendar-shell';
import ForcedLayoutShell from '@/components/shells/forced-layout-graph/forced-layout-graph-shell';
import FilterForcedLayoutShell from '@/components/shells/forced-layout-graph/filter-forced-layout-graph-shell';
import FunnelShell from '@/components/shells/funnel/funnel-shell';
import FilterFunnelShell from '@/components/shells/funnel/filter-funnel-shell';
import HebShell from '@/components/shells/hierarchical-edge-bundling/hierarchical-edge-bundling-shell';
import FilterHebShell from '@/components/shells/hierarchical-edge-bundling/filter-hierarchical-edge-bundling-shell';
import MatrixShell from '@/components/shells/matrix/matrix-shell';
import FilterMatrixShell from '@/components/shells/matrix/filter-matrix-shell';
import PieShell from '@/components/shells/pie-chart/piechart-shell';
import FilterPieShell from '@/components/shells/pie-chart/filter-piechart-shell';
import SankeyShell from '@/components/shells/sankey/sankey-shell';
import FilterSankeyShell from '@/components/shells/sankey/filter-sankey-shell';
import ScatterShell from '@/components/shells/scatter/scatter-shell';
import FilterScatterShell from '@/components/shells/scatter/filter-scatter-shell';
import SunburstShell from '@/components/shells/sunburst/sunburst-shell';
import FilterSunburstShell from '@/components/shells/sunburst/filtered-sunburst-shell';
import TimelineShell from '@/components/shells/timeline/timeline-shell';
import FilterTimelineShell from '@/components/shells/timeline/filter-timeline-shell';
import TreemapShell from '@/components/shells/treemap/treemap-shell';
import FilterTreemapShell from '@/components/shells/treemap/filter-treemap-shell';
import WordcloudShell from '@/components/shells/wordcloud/wordcloud-shell';
import FilterWordcloudShell from '@/components/shells/wordcloud/filter-wordcloud-shell';

const common = {
  legend: false,
  options: {},
  fullScreen: false
};

const nodeLinkData = {
  nodes: [{ name: 'NodeA', category: '1', properties: 'p' }],
  links: [{ source: 'NodeA', target: 'NodeA', value: 1 }]
};
const axisData = { headers: ['h'], values: { series: [1] } };
const pieFunnelData = { values: { first: 1, second: 2 } };
const calendarData = { calendar: [{ date: '2020-01-01', value: 1, category: '1', properties: 'p' }] };
const scatterData = { points: [{ value: [1, 2], category: 'c' }] };
const hierarchyData = { nodes: [{ name: 'root', value: 1, category: '1', properties: 'p' }] };
const wordCloudData = { words: [{ name: 'word', value: 1, properties: 'p' }] };
const timelineData = { timeline: { events: [{ summary: 'e', date: '2020-01-01', type: 'event', author: 'a' }] } };

describe('shell wrappers coverage', () => {
  it('covers non-filter and filter branches across shell wrappers', () => {
    render(<AxisShell {...common} data={axisData as any} type="line" filter={false} />);
    render(<AxisShell {...common} data={axisData as any} type="bar" filter />);
    render(<CalendarShell {...common} data={calendarData as any} filter={false} />);
    render(<CalendarShell {...common} data={calendarData as any} filter />);
    render(<ForcedLayoutShell {...common} data={nodeLinkData as any} filter={false} />);
    render(<ForcedLayoutShell {...common} data={nodeLinkData as any} filter />);
    render(<FunnelShell {...common} data={pieFunnelData as any} filter={false} />);
    render(<FunnelShell {...common} data={pieFunnelData as any} filter />);
    render(<HebShell {...common} data={nodeLinkData as any} filter={false} />);
    render(<HebShell {...common} data={nodeLinkData as any} filter />);
    render(<MatrixShell {...common} data={nodeLinkData as any} filter={false} />);
    render(<MatrixShell {...common} data={nodeLinkData as any} filter />);
    render(<PieShell {...common} data={pieFunnelData as any} filter={false} />);
    render(<PieShell {...common} data={pieFunnelData as any} filter />);
    render(<SankeyShell {...common} data={nodeLinkData as any} filter={false} />);
    render(<SankeyShell {...common} data={nodeLinkData as any} filter />);
    render(<ScatterShell {...common} data={scatterData as any} filter={false} />);
    render(<ScatterShell {...common} data={scatterData as any} filter />);
    render(<SunburstShell {...common} data={hierarchyData as any} filter={false} />);
    render(<SunburstShell {...common} data={hierarchyData as any} filter />);
    render(<TimelineShell {...common} data={timelineData as any} filter={false} />);
    render(<TimelineShell {...common} data={timelineData as any} filter />);
    render(<TreemapShell {...common} data={hierarchyData as any} filter={false} />);
    render(<TreemapShell {...common} data={hierarchyData as any} filter />);
    render(<WordcloudShell {...common} data={wordCloudData as any} filter={false} />);
    render(<WordcloudShell {...common} data={wordCloudData as any} filter />);

    expect(screen.getAllByTestId('dynamic-view').length).toBeGreaterThan(10);
  });

  it('covers filtered shell components directly', () => {
    render(<FilterAxisShell {...common} data={axisData as any} type="line" />);
    render(<FilterAxisShell {...common} data={axisData as any} type="bar" />);
    render(<FilterCalendarShell {...common} data={calendarData as any} />);
    render(<FilterForcedLayoutShell {...common} nodes={nodeLinkData.nodes as any} links={nodeLinkData.links as any} />);
    render(<FilterFunnelShell {...common} data={pieFunnelData as any} />);
    render(<FilterHebShell {...common} nodes={nodeLinkData.nodes as any} links={nodeLinkData.links as any} />);
    render(<FilterMatrixShell {...common} nodes={nodeLinkData.nodes as any} links={nodeLinkData.links as any} />);
    render(<FilterPieShell {...common} data={pieFunnelData as any} />);
    render(<FilterSankeyShell {...common} nodes={nodeLinkData.nodes as any} links={nodeLinkData.links as any} />);
    render(<FilterScatterShell {...common} data={scatterData as any} />);
    render(<FilterSunburstShell {...common} data={hierarchyData as any} />);
    render(<FilterTimelineShell {...common} data={timelineData as any} />);
    render(<FilterTreemapShell {...common} data={hierarchyData as any} />);
    render(<FilterWordcloudShell {...common} data={wordCloudData as any} />);

    expect(screen.getAllByTestId('apply-search').length).toBeGreaterThan(5);
  });
});
